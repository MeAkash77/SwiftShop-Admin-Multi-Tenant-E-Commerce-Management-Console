/**
 * Rule-based support bot — order lookup, cancel/return guidance, product requests.
 * Does not grant customers product write access; catalog changes go to vendors as requests.
 */
import Product from "../models/productModel.js";
import Store from "../models/storeModel.js";
import { Order, OrderItem } from "../models/orderModel.js";

const QUICK_REPLIES = [
  { id: "track", label: "Track my order" },
  { id: "cancel", label: "Cancel an order" },
  { id: "return", label: "Return / refund help" },
  { id: "product", label: "Ask about a product" },
  { id: "payment", label: "Payment help" },
];

export function welcomePayload(firstName) {
  const name = firstName || "there";
  return {
    text: `Hi ${name}! I'm MultiAssist — your order helper. I can track orders, guide cancel/return, and send product questions to the seller.`,
    meta: {
      type: "welcome",
      quickReplies: QUICK_REPLIES,
    },
  };
}

function detectIntent(raw) {
  const text = String(raw || "").toLowerCase().trim();
  if (!text) return { intent: "empty" };

  if (/^(hi|hello|hey|help|start)\b/.test(text)) return { intent: "greeting" };
  if (/track|where.*(order|package)|status|shipping|delivery/.test(text))
    return { intent: "track" };
  if (/cancel/.test(text)) return { intent: "cancel" };
  if (/return|refund|replace/.test(text)) return { intent: "return" };
  if (/pay(ment)?|razorpay|upi|cod|invoice/.test(text)) return { intent: "payment" };
  if (/product|stock|size|color|variant|available|similar/.test(text))
    return { intent: "product" };

  const orderMatch = text.match(/\b(ord-[\w-]+)\b/i) || text.match(/\border\s*[#:.]?\s*([a-z0-9-]+)\b/i);
  if (orderMatch) return { intent: "order_lookup", orderNumber: orderMatch[1] };

  return { intent: "unknown" };
}

async function loadCustomerOrders(customerId, limit = 8) {
  return Order.find({ customerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("storeId", "storeName")
    .lean();
}

function formatOrderLine(order) {
  const storeName = order.storeId?.storeName || "Store";
  return {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    status: order.orderStatus,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    storeName,
    storeId: order.storeId?._id ? String(order.storeId._id) : String(order.storeId),
  };
}

async function orderDetailCard(order) {
  const items = await OrderItem.find({ orderId: order._id })
    .populate("productId", "name")
    .lean();
  const card = formatOrderLine(order);
  card.items = items.map((i) => ({
    name: i.productId?.name || "Item",
    quantity: i.quantity,
    price: i.price,
  }));
  return card;
}

/**
 * @returns {{ text: string, meta?: object, sessionPatch?: object, sideEffects?: object }}
 */
export async function processCustomerMessage({
  customerId,
  text,
  session,
  quickReplyId,
}) {
  const input = quickReplyId || text;
  let intentInfo = quickReplyId
    ? { intent: quickReplyId === "product" ? "product" : quickReplyId }
    : detectIntent(input);

  if (quickReplyId === "track") intentInfo = { intent: "track" };
  if (quickReplyId === "cancel") intentInfo = { intent: "cancel" };
  if (quickReplyId === "return") intentInfo = { intent: "return" };
  if (quickReplyId === "payment") intentInfo = { intent: "payment" };
  if (quickReplyId === "product") intentInfo = { intent: "product" };

  const awaiting = session?.metaAwaiting || session?.messages?.slice(-1)?.[0]?.meta?.awaiting;

  // Continue product-request flow
  if (awaiting === "product_details" || session?.topic === "product_request") {
    const lastBot = [...(session.messages || [])].reverse().find((m) => m.role === "bot");
    if (lastBot?.meta?.awaiting === "product_details") {
      return await handleProductRequestDetails({ customerId, text, session });
    }
  }

  if (awaiting === "pick_order" || lastAwaiting(session) === "pick_order") {
    const orders = await loadCustomerOrders(customerId, 12);
    const pick = matchOrderFromText(text, orders);
    if (pick) {
      const populated = await Order.findById(pick._id).populate("storeId", "storeName").lean();
      const card = await orderDetailCard(populated);
      const lastBot = [...(session.messages || [])].reverse().find((m) => m.role === "bot");
      const topic =
        session._pendingTopic ||
        lastBot?.meta?.pendingTopic ||
        session.topic ||
        "track";
      return respondForOrderTopic(topic, card, populated);
    }
  }

  switch (intentInfo.intent) {
    case "empty":
      return {
        text: "Type a message, or pick a quick option below.",
        meta: { quickReplies: QUICK_REPLIES },
      };

    case "greeting":
      return {
        text: "What can I help with today?",
        meta: { quickReplies: QUICK_REPLIES },
      };

    case "track":
    case "cancel":
    case "return":
    case "payment": {
      const orders = await loadCustomerOrders(customerId, 8);
      if (!orders.length) {
        return {
          text: "You don't have any orders yet. Browse the shop and place one — then I can track it here.",
          meta: {
            quickReplies: [{ id: "shop", label: "Browse products", href: "/customer/products" }],
            links: [{ label: "Shop products", href: "/customer/products" }],
          },
        };
      }
      if (intentInfo.orderNumber) {
        const hit = matchOrderFromText(intentInfo.orderNumber, orders);
        if (hit) {
          const populated = await Order.findById(hit._id).populate("storeId", "storeName").lean();
          const card = await orderDetailCard(populated);
          return respondForOrderTopic(intentInfo.intent, card, populated);
        }
      }
      return {
        text: `Here are your recent orders. Reply with an order number (e.g. ${orders[0].orderNumber}) or tap one below.`,
        meta: {
          type: "order_list",
          awaiting: "pick_order",
          pendingTopic: intentInfo.intent,
          orders: orders.map(formatOrderLine),
          quickReplies: QUICK_REPLIES,
        },
        sessionPatch: {
          topic: mapTopic(intentInfo.intent),
          _pendingTopic: intentInfo.intent,
        },
      };
    }

    case "order_lookup": {
      const orders = await loadCustomerOrders(customerId, 20);
      const hit = matchOrderFromText(intentInfo.orderNumber, orders);
      if (!hit) {
        return {
          text: `I couldn't find order "${intentInfo.orderNumber}" on your account. Double-check the number on Orders.`,
          meta: {
            links: [{ label: "My orders", href: "/customer/orders" }],
            quickReplies: QUICK_REPLIES,
          },
        };
      }
      const populated = await Order.findById(hit._id).populate("storeId", "storeName").lean();
      const card = await orderDetailCard(populated);
      return {
        text: `Found ${card.orderNumber}: ${card.status} · Payment ${card.paymentStatus} · ₹${card.totalAmount}.`,
        meta: {
          type: "order_card",
          order: card,
          actions: orderActions(populated),
          quickReplies: QUICK_REPLIES,
        },
        sessionPatch: {
          orderId: hit._id,
          storeId: hit.storeId?._id || hit.storeId,
          topic: "track_order",
        },
      };
    }

    case "product":
      return {
        text: "Tell me the product name (or paste what you need — stock, size, or an issue). I'll send a request to the seller so they can follow up.",
        meta: {
          awaiting: "product_details",
          quickReplies: QUICK_REPLIES,
        },
        sessionPatch: { topic: "product_request" },
      };

    default:
      return {
        text: "I can help with order tracking, cancel/return steps, payments, or product questions for the seller. Pick an option or paste your order number.",
        meta: { quickReplies: QUICK_REPLIES },
      };
  }
}

function lastAwaiting(session) {
  const last = [...(session?.messages || [])].reverse().find((m) => m.role === "bot");
  return last?.meta?.awaiting || null;
}

function mapTopic(intent) {
  const map = {
    track: "track_order",
    cancel: "cancel_order",
    return: "return_order",
    payment: "payment",
  };
  return map[intent] || "general";
}

function matchOrderFromText(text, orders) {
  const raw = String(text || "").trim();
  const upper = raw.toUpperCase();
  return (
    orders.find((o) => o.orderNumber?.toUpperCase() === upper) ||
    orders.find((o) => upper.includes(String(o.orderNumber || "").toUpperCase())) ||
    orders.find((o) => String(o._id) === raw)
  );
}

function orderActions(order) {
  const actions = [{ id: "view_orders", label: "Open Orders", href: "/customer/orders" }];
  if (!["Cancelled", "Returned", "Delivered", "Shipped"].includes(order.orderStatus)) {
    if (["Pending", "Confirmed"].includes(order.orderStatus)) {
      actions.push({
        id: "cancel_hint",
        label: "How to cancel",
        hint: "cancel",
      });
    }
  }
  if (order.orderStatus === "Delivered") {
    actions.push({ id: "return_hint", label: "How to return", hint: "return" });
  }
  return actions;
}

function respondForOrderTopic(topic, card, order) {
  const storeId = order.storeId?._id || order.storeId;
  const patch = {
    orderId: order._id,
    storeId,
    topic: mapTopic(topic === "track" ? "track" : topic),
    status: "open",
  };

  if (topic === "cancel" || topic === "cancel_order") {
    const canCancel = ["Pending", "Confirmed"].includes(order.orderStatus);
    return {
      text: canCancel
        ? `${card.orderNumber} is ${card.status}. You can cancel it from Orders while it's still Pending/Confirmed. Open Orders and use Cancel — or tell the seller if you need help.`
        : `${card.orderNumber} is already ${card.status}, so it can't be cancelled in-app. If it's shipped/delivered, use return help or message the seller.`,
      meta: {
        type: "order_card",
        order: card,
        actions: orderActions(order),
        links: [{ label: "My orders", href: "/customer/orders" }],
        quickReplies: QUICK_REPLIES,
      },
      sessionPatch: { ...patch, topic: "cancel_order", status: canCancel ? "open" : "waiting_vendor" },
    };
  }

  if (topic === "return" || topic === "return_order") {
    const canReturn = order.orderStatus === "Delivered";
    return {
      text: canReturn
        ? `${card.orderNumber} is Delivered. Request a return from Orders. Refunds are handled offline by the store (not automatic via Razorpay).`
        : `Returns are available after delivery. ${card.orderNumber} is currently ${card.status}.`,
      meta: {
        type: "order_card",
        order: card,
        actions: orderActions(order),
        links: [
          { label: "My orders", href: "/customer/orders" },
          { label: "Return policy", href: "/customer/info/returns" },
        ],
        quickReplies: QUICK_REPLIES,
      },
      sessionPatch: {
        ...patch,
        topic: "return_order",
        status: canReturn ? "open" : "waiting_vendor",
      },
    };
  }

  if (topic === "payment") {
    return {
      text: `${card.orderNumber}: payment is ${card.paymentStatus} (${order.paymentMethod}). ${
        order.paymentStatus === "Pending" && order.paymentMethod !== "COD"
          ? "You can retry online pay from Orders."
          : order.paymentNote || "You're all set on payment status."
      }`,
      meta: {
        type: "order_card",
        order: card,
        links: [
          { label: "Orders", href: "/customer/orders" },
          { label: "Payments help", href: "/customer/info/payments" },
        ],
        quickReplies: QUICK_REPLIES,
      },
      sessionPatch: { ...patch, topic: "payment" },
    };
  }

  // track default
  return {
    text: `${card.orderNumber} · ${card.status} · ${card.storeName} · ₹${card.totalAmount}. ${
      order.shippingAddress?.city
        ? `Delivering to ${order.shippingAddress.city}.`
        : ""
    }`,
    meta: {
      type: "order_card",
      order: card,
      actions: orderActions(order),
      links: [{ label: "My orders", href: "/customer/orders" }],
      quickReplies: QUICK_REPLIES,
    },
    sessionPatch: { ...patch, topic: "track_order" },
  };
}

async function handleProductRequestDetails({ customerId, text, session }) {
  const details = String(text || "").trim();
  if (details.length < 3) {
    return {
      text: "Please share a bit more detail (product name + what you need).",
      meta: { awaiting: "product_details", quickReplies: QUICK_REPLIES },
    };
  }

  // Try match product by name for this customer's recent order stores, else any active product
  const recent = await loadCustomerOrders(customerId, 5);
  const storeIds = [
    ...new Set(
      recent
        .map((o) => String(o.storeId?._id || o.storeId || ""))
        .filter(Boolean)
    ),
  ];

  let product = null;
  if (storeIds.length) {
    product = await Product.findOne({
      store: { $in: storeIds },
      status: "active",
      name: new RegExp(details.split(/\s+/).slice(0, 4).join("|"), "i"),
    }).lean();
  }
  if (!product) {
    product = await Product.findOne({
      status: "active",
      name: new RegExp(details.split(/\s+/).slice(0, 3).join(".*"), "i"),
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  let storeId = product?.store || session.storeId || null;
  if (!storeId && storeIds[0]) storeId = storeIds[0];

  const store = storeId ? await Store.findById(storeId).select("storeName").lean() : null;

  const requestType = /stock|available/.test(details.toLowerCase())
    ? "stock"
    : /similar|other|like/.test(details.toLowerCase())
      ? "similar"
      : /issue|wrong|defect|broken/.test(details.toLowerCase())
        ? "issue"
        : product
          ? "info"
          : "other";

  return {
    text: product
      ? `Got it — I logged a request about "${product.name}" for ${store?.storeName || "the seller"}. They can see this in Support inbox and improve your order experience.`
      : `I've shared your product request with ${store?.storeName || "the seller"}. They'll see it in their Support history.`,
    meta: {
      type: "product_request",
      productRequest: {
        productId: product?._id || null,
        productName: product?.name || details.slice(0, 120),
        requestType,
        details,
        status: "pending",
      },
      links: product
        ? [{ label: "View product", href: `/customer/products/${product._id}` }]
        : [{ label: "Browse products", href: "/customer/products" }],
      quickReplies: QUICK_REPLIES,
    },
    sessionPatch: {
      topic: "product_request",
      status: "waiting_vendor",
      storeId: storeId || undefined,
      productRequest: {
        productId: product?._id || null,
        productName: product?.name || details.slice(0, 120),
        requestType,
        details,
        status: "pending",
      },
      unreadByVendor: 1,
    },
  };
}

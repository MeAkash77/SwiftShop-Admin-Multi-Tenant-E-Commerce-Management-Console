/**
 * Support chat controller — customer bot sessions + vendor inbox/replies.
 */
import ChatSession from "../models/chatSessionModel.js";
import Store from "../models/storeModel.js";
import User from "../models/userModel.js";
import {
  processCustomerMessage,
  welcomePayload,
} from "../services/supportBotService.js";

function publicSession(doc) {
  const s = doc.toObject ? doc.toObject() : doc;
  return {
    _id: s._id,
    customerId: s.customerId,
    storeId: s.storeId,
    orderId: s.orderId,
    subject: s.subject,
    topic: s.topic,
    status: s.status,
    productRequest: s.productRequest,
    messages: s.messages || [],
    lastMessageAt: s.lastMessageAt,
    unreadByVendor: s.unreadByVendor,
    unreadByCustomer: s.unreadByCustomer,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

/** Start or resume an open support session for the customer. */
export const startOrGetSession = async (req, res) => {
  try {
    let session = await ChatSession.findOne({
      customerId: req.user.id,
      status: { $in: ["open", "waiting_vendor"] },
    }).sort({ lastMessageAt: -1 });

    if (!session) {
      const user = await User.findById(req.user.id).select("firstName");
      const welcome = welcomePayload(user?.firstName);
      session = await ChatSession.create({
        customerId: req.user.id,
        subject: "Order support",
        topic: "general",
        status: "open",
        messages: [
          {
            role: "bot",
            text: welcome.text,
            meta: welcome.meta,
          },
        ],
        lastMessageAt: new Date(),
      });
    }

    return res.status(200).json({ success: true, data: publicSession(session) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** List customer's sessions. */
export const listMySessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ customerId: req.user.id })
      .sort({ lastMessageAt: -1 })
      .limit(30)
      .select("-messages")
      .lean();

    return res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSession = async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.id)
      .populate("storeId", "storeName")
      .populate("customerId", "firstName lastName email")
      .populate("orderId", "orderNumber orderStatus paymentStatus totalAmount");

    if (!session) {
      return res.status(404).json({ success: false, message: "Chat not found." });
    }

    if (req.user.role === "customer") {
      if (String(session.customerId._id || session.customerId) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
      session.unreadByCustomer = 0;
      await session.save();
    }

    if (req.user.role === "vendor") {
      const store = await Store.findOne({ vendorId: req.user.id });
      if (!store || String(session.storeId?._id || session.storeId) !== String(store._id)) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
      session.unreadByVendor = 0;
      await session.save();
    }

    return res.status(200).json({ success: true, data: publicSession(session) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Customer sends a message → bot replies. */
export const customerSendMessage = async (req, res) => {
  try {
    const { text = "", quickReplyId = null } = req.body;
    const session = await ChatSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Chat not found." });
    }
    if (String(session.customerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    if (["closed", "resolved"].includes(session.status)) {
      session.status = "open";
    }

    const trimmed = String(text || "").trim();
    if (!quickReplyId && !trimmed) {
      return res.status(400).json({ success: false, message: "Message is empty." });
    }

    if (trimmed || quickReplyId) {
      session.messages.push({
        role: "customer",
        senderId: req.user.id,
        text: trimmed || (quickReplyId ? `[${quickReplyId}]` : ""),
        meta: quickReplyId ? { quickReplyId } : null,
      });
    }

    // Attach pending topic from last bot meta if picking order
    const lastBot = [...session.messages].reverse().find((m) => m.role === "bot");
    if (lastBot?.meta?.pendingTopic) {
      session._pendingTopic = lastBot.meta.pendingTopic;
    }

    const reply = await processCustomerMessage({
      customerId: req.user.id,
      text: trimmed,
      session,
      quickReplyId,
    });

    if (reply.sessionPatch) {
      const patch = { ...reply.sessionPatch };
      delete patch._pendingTopic;
      if (patch.productRequest) {
        session.productRequest = {
          ...session.productRequest?.toObject?.() || session.productRequest || {},
          ...patch.productRequest,
        };
        delete patch.productRequest;
      }
      Object.assign(session, patch);
    }

    session.messages.push({
      role: "bot",
      text: reply.text,
      meta: reply.meta || null,
    });
    session.lastMessageAt = new Date();

    if (session.status === "waiting_vendor" || session.topic === "product_request") {
      session.unreadByVendor = (session.unreadByVendor || 0) + 1;
    }

    await session.save();

    return res.status(200).json({ success: true, data: publicSession(session) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Vendor inbox — sessions for their store (product/order history). */
export const vendorListSessions = async (req, res) => {
  try {
    const store = await Store.findOne({ vendorId: req.user.id });
    if (!store) {
      return res.status(400).json({
        success: false,
        message: "Create your store before viewing support chats.",
      });
    }

    const filter = { storeId: store._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.topic) filter.topic = req.query.topic;

    const sessions = await ChatSession.find(filter)
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .populate("customerId", "firstName lastName email")
      .populate("orderId", "orderNumber orderStatus totalAmount")
      .lean();

    return res.status(200).json({
      success: true,
      data: sessions,
      unreadTotal: sessions.reduce((n, s) => n + (s.unreadByVendor || 0), 0),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Vendor replies — helps improve customer order experience. */
export const vendorReply = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ success: false, message: "Reply text required." });
    }

    const store = await Store.findOne({ vendorId: req.user.id });
    if (!store) {
      return res.status(400).json({ success: false, message: "Store not found." });
    }

    const session = await ChatSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat not found." });
    }
    if (String(session.storeId) !== String(store._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    session.messages.push({
      role: "vendor",
      senderId: req.user.id,
      text,
      meta: null,
    });
    session.status = "open";
    session.unreadByVendor = 0;
    session.unreadByCustomer = (session.unreadByCustomer || 0) + 1;
    session.lastMessageAt = new Date();

    if (req.body.productRequestStatus && session.productRequest) {
      session.productRequest.status = req.body.productRequestStatus;
    }

    await session.save();

    return res.status(200).json({ success: true, data: publicSession(session) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** Vendor product-request history (catalog feedback). */
export const vendorProductRequestHistory = async (req, res) => {
  try {
    const store = await Store.findOne({ vendorId: req.user.id });
    if (!store) {
      return res.status(400).json({ success: false, message: "Store not found." });
    }

    const sessions = await ChatSession.find({
      storeId: store._id,
      topic: "product_request",
      "productRequest.details": { $ne: null },
    })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .populate("customerId", "firstName lastName email")
      .populate("productRequest.productId", "name sku stock price status")
      .lean();

    const history = sessions.map((s) => ({
      sessionId: s._id,
      customer: s.customerId,
      productRequest: s.productRequest,
      status: s.status,
      lastMessageAt: s.lastMessageAt,
      product: s.productRequest?.productId || null,
    }));

    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveSession = async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat not found." });
    }

    if (req.user.role === "customer") {
      if (String(session.customerId) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    } else if (req.user.role === "vendor") {
      const store = await Store.findOne({ vendorId: req.user.id });
      if (!store || String(session.storeId) !== String(store._id)) {
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    } else if (req.user.role !== "superAdmin") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    session.status = "resolved";
    session.messages.push({
      role: "system",
      text: "Conversation marked as resolved.",
      meta: null,
    });
    session.lastMessageAt = new Date();
    await session.save();

    return res.status(200).json({ success: true, data: publicSession(session) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

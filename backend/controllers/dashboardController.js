/**
 * Platform dashboard stats for Super Admin (users, orders, sales, 7-day series).
 * Also returns demand insights: growth ("greening") and products with high sale chance.
 * Daily report endpoint supports admin + vendor historical ranges and day downloads.
 */
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Store from "../models/storeModel.js";
import { Order, OrderItem } from "../models/orderModel.js";

const MAX_REPORT_DAYS = 366;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function toDateKey(d) {
  return startOfDay(d).toISOString().slice(0, 10);
}

function parseIsoDate(value) {
  if (!value || typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = startOfDay(new Date(`${value}T12:00:00`));
  return Number.isNaN(d.getTime()) ? null : d;
}

function resolveReportRange(query = {}) {
  const today = startOfDay(new Date());
  let from = parseIsoDate(query.from);
  let to = parseIsoDate(query.to);

  if (!from || !to) {
    const days = Math.min(
      MAX_REPORT_DAYS,
      Math.max(1, Number(query.days) || 7)
    );
    to = today;
    from = startOfDay(new Date(today));
    from.setDate(from.getDate() - (days - 1));
  }

  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }

  const spanDays =
    Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (spanDays > MAX_REPORT_DAYS) {
    from = startOfDay(new Date(to));
    from.setDate(from.getDate() - (MAX_REPORT_DAYS - 1));
  }

  return { from, to };
}

async function resolveVendorStoreId(user) {
  if (!user || user.role !== "vendor") return null;
  const store = await Store.findOne({ vendorId: user.id }).select("_id").lean();
  return store?._id || null;
}

function buildDailySeries(from, to, dayMap) {
  const dailyReport = [];
  const cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor <= end) {
    const key = toDateKey(cursor);
    dailyReport.push({
      date: key,
      orders: dayMap[key]?.orders || 0,
      sales: dayMap[key]?.sales || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return dailyReport;
}

/**
 * GET /dashboard/daily-report
 * Query: days=7|30|90 OR from=&to= (YYYY-MM-DD). Optional date= for one-day order detail.
 * Admin: marketplace-wide. Vendor: own store only.
 */
export const getDailyReport = async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== "superAdmin" && role !== "vendor") {
      return res.status(403).json({ message: "Not allowed to view reports." });
    }

    let storeFilter = {};
    if (role === "vendor") {
      const storeId = await resolveVendorStoreId(req.user);
      if (!storeId) {
        return res.status(404).json({ message: "Store not found for vendor." });
      }
      storeFilter = { storeId };
    }

    const detailDate = parseIsoDate(req.query.date);
    if (detailDate) {
      const dayStart = startOfDay(detailDate);
      const dayEnd = endOfDay(detailDate);
      const orders = await Order.find({
        ...storeFilter,
        createdAt: { $gte: dayStart, $lte: dayEnd },
      })
        .select(
          "orderNumber totalAmount paymentStatus orderStatus createdAt customerId"
        )
        .populate("customerId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .lean();

      const sales = orders
        .filter((o) => o.paymentStatus === "Paid")
        .reduce((s, o) => s + Number(o.totalAmount || 0), 0);

      return res.status(200).json({
        message: "Daily report detail fetched successfully",
        date: toDateKey(detailDate),
        summary: {
          orders: orders.length,
          sales,
        },
        orders: orders.map((o) => ({
          orderId: o._id,
          orderNumber: o.orderNumber || String(o._id).slice(-8),
          createdAt: o.createdAt,
          paymentStatus: o.paymentStatus,
          orderStatus: o.orderStatus,
          totalAmount: o.totalAmount || 0,
          customerName:
            [o.customerId?.firstName, o.customerId?.lastName]
              .filter(Boolean)
              .join(" ") || "—",
          customerEmail: o.customerId?.email || "",
        })),
      });
    }

    const { from, to } = resolveReportRange(req.query);
    const dailyOrders = await Order.aggregate([
      {
        $match: {
          ...storeFilter,
          createdAt: { $gte: from, $lte: endOfDay(to) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          orders: { $sum: 1 },
          sales: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "Paid"] },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dayMap = Object.fromEntries(
      dailyOrders.map((day) => [day._id, day])
    );
    const dailyReport = buildDailySeries(from, to, dayMap);
    const totals = dailyReport.reduce(
      (acc, day) => {
        acc.orders += Number(day.orders || 0);
        acc.sales += Number(day.sales || 0);
        return acc;
      },
      { orders: 0, sales: 0 }
    );

    return res.status(200).json({
      message: "Daily report fetched successfully",
      from: toDateKey(from),
      to: toDateKey(to),
      scope: role === "vendor" ? "store" : "marketplace",
      totals,
      dailyReport,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to load daily report",
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const startOfToday = startOfDay(new Date());

    const sevenDaysAgo = startOfDay(new Date());
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const fourteenDaysAgo = startOfDay(new Date());
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

    const [
      usersCount,
      ordersCount,
      storesCount,
      productsCount,
      stockAgg,
      salesAgg,
      todayOrders,
      todaySalesAgg,
      dailyOrders,
      recentPaidOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Store.countDocuments(),
      Product.countDocuments(),
      Product.aggregate([
        { $group: { _id: null, totalStock: { $sum: "$stock" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentStatus: { $in: ["Paid"] },
          },
        },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfToday },
            paymentStatus: "Paid",
          },
        },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            orders: { $sum: 1 },
            sales: {
              $sum: {
                $cond: [
                  { $eq: ["$paymentStatus", "Paid"] },
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.find({
        paymentStatus: "Paid",
        createdAt: { $gte: fourteenDaysAgo },
      })
        .select("_id createdAt")
        .lean(),
    ]);

    const dayMap = Object.fromEntries(
      dailyOrders.map((day) => [day._id, day])
    );

    const dailyReport = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      dailyReport.push({
        date: key,
        orders: dayMap[key]?.orders || 0,
        sales: dayMap[key]?.sales || 0,
      });
    }

    const weekSales = dailyReport.reduce((s, d) => s + (d.sales || 0), 0);
    const weekOrders = dailyReport.reduce((s, d) => s + (d.orders || 0), 0);
    const prevWeekStart = startOfDay(new Date(fourteenDaysAgo));
    const prevWeekEnd = new Date(sevenDaysAgo);
    prevWeekEnd.setMilliseconds(-1);

    const prevWeekAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: prevWeekStart, $lte: prevWeekEnd },
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
    ]);
    const prevWeekSales = prevWeekAgg[0]?.sales || 0;
    const prevWeekOrders = prevWeekAgg[0]?.orders || 0;
    const salesGrowthPct =
      prevWeekSales > 0
        ? Math.round(((weekSales - prevWeekSales) / prevWeekSales) * 100)
        : weekSales > 0
          ? 100
          : 0;
    const ordersGrowthPct =
      prevWeekOrders > 0
        ? Math.round(((weekOrders - prevWeekOrders) / prevWeekOrders) * 100)
        : weekOrders > 0
          ? 100
          : 0;

    const orderIds = recentPaidOrders.map((o) => o._id);
    const orderDateById = Object.fromEntries(
      recentPaidOrders.map((o) => [String(o._id), o.createdAt])
    );

    let hotProducts = [];
    if (orderIds.length) {
      const itemRows = await OrderItem.aggregate([
        { $match: { orderId: { $in: orderIds } } },
        {
          $group: {
            _id: "$productId",
            units: { $sum: "$quantity" },
            revenue: { $sum: { $multiply: ["$quantity", "$price"] } },
            orderIds: { $addToSet: "$orderId" },
          },
        },
        { $sort: { units: -1 } },
        { $limit: 12 },
      ]);

      const productIds = itemRows.map((r) => r._id);
      const products = await Product.find({ _id: { $in: productIds } })
        .select("name stock lowStockThreshold status store")
        .populate("store", "storeName")
        .lean();
      const productById = Object.fromEntries(
        products.map((p) => [String(p._id), p])
      );

      const weekCutoff = sevenDaysAgo.getTime();
      hotProducts = itemRows
        .map((row) => {
          const product = productById[String(row._id)];
          if (!product) return null;
          let ordersThisWeek = 0;
          let ordersPrevWeek = 0;
          for (const oid of row.orderIds || []) {
            const created = orderDateById[String(oid)];
            if (!created) continue;
            const t = new Date(created).getTime();
            if (t >= weekCutoff) ordersThisWeek += 1;
            else ordersPrevWeek += 1;
          }
          const stock = Number(product.stock ?? 0);
          const velocity = Number(row.units) || 0;
          const growthBoost =
            ordersPrevWeek > 0 && ordersThisWeek > ordersPrevWeek ? 12 : 0;
          const stockPenalty = stock <= 0 ? -35 : stock <= 5 ? -10 : 8;
          const chance = Math.max(
            5,
            Math.min(
              98,
              Math.round(28 + velocity * 6 + growthBoost + stockPenalty)
            )
          );
          return {
            productId: product._id,
            name: product.name,
            storeName: product.store?.storeName || "—",
            unitsSold: velocity,
            revenue: Math.round(row.revenue || 0),
            stock,
            chance,
            trend:
              ordersThisWeek > ordersPrevWeek
                ? "up"
                : ordersThisWeek < ordersPrevWeek
                  ? "down"
                  : "flat",
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.chance - a.chance || b.unitsSold - a.unitsSold)
        .slice(0, 8);
    }

    const greening =
      salesGrowthPct >= 8 || ordersGrowthPct >= 8
        ? "rising"
        : salesGrowthPct <= -8 || ordersGrowthPct <= -8
          ? "cooling"
          : "steady";

    return res.status(200).json({
      message: "Dashboard stats fetched successfully",
      stats: {
        users: usersCount,
        orders: ordersCount,
        stores: storesCount,
        products: productsCount,
        stock: stockAgg[0]?.totalStock || 0,
        sales: salesAgg[0]?.totalSales || 0,
        todayOrders,
        todaySales: todaySalesAgg[0]?.totalSales || 0,
      },
      dailyReport,
      demand: {
        greening,
        weekSales,
        prevWeekSales,
        salesGrowthPct,
        weekOrders,
        prevWeekOrders,
        ordersGrowthPct,
        hotProducts,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to load dashboard stats",
    });
  }
};

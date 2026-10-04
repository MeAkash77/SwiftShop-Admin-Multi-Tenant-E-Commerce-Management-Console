import InfoPage from "./InfoPage";

export const AboutPage = () => (
  <InfoPage title="About Us">
    <p>
      MultiCommerce is a multi-tenant online marketplace connecting customers with trusted vendor
      stores across categories like Electronics, Fashion, Home, Beauty, and more.
    </p>
    <p>
      Our mission is to make shopping simple, secure, and fast — with transparent pricing, easy
      returns, and reliable order tracking.
    </p>
    <h2>What we offer</h2>
    <ul>
      <li>Wide catalog from multiple vendor stores</li>
      <li>Secure login with OTP email verification</li>
      <li>Cart, wishlist, and order management</li>
      <li>Vendor tools for store, inventory, and fulfillment</li>
    </ul>
  </InfoPage>
);

export const CareersPage = () => (
  <InfoPage title="Careers">
    <p>Join MultiCommerce and help build the next generation of multi-tenant commerce.</p>
    <h2>Open roles</h2>
    <ul>
      <li>Frontend Engineer (React)</li>
      <li>Backend Engineer (Node.js / MongoDB)</li>
      <li>Product Designer</li>
      <li>Customer Success Associate</li>
    </ul>
    <p>
      Send your resume to <strong>careers@multicommerce.local</strong> with the role in the subject
      line.
    </p>
  </InfoPage>
);

export const PressPage = () => (
  <InfoPage title="Press">
    <p>Media resources and brand information for MultiCommerce.</p>
    <h2>Press contact</h2>
    <p>
      Email: <strong>press@multicommerce.local</strong>
    </p>
    <h2>Brand kit</h2>
    <ul>
      <li>Product name: MultiCommerce</li>
      <li>Tagline: Explore Plus</li>
      <li>Primary color: #2874f0</li>
    </ul>
  </InfoPage>
);

export const ContactPage = () => (
  <InfoPage title="Contact Us">
    <p>We are here to help with orders, account, and store support.</p>
    <h2>Mail Us</h2>
    <p>
      MultiCommerce Internet Pvt Ltd
      <br />
      Ahmedabad, Gujarat, India
    </p>
    <h2>Support</h2>
    <ul>
      <li>Email: support@multicommerce.local</li>
      <li>Phone: 1800-000-0000 (Mon–Sat, 9 AM – 8 PM)</li>
    </ul>
    <h2>Corporate</h2>
    <ul>
      <li>Partnerships: partners@multicommerce.local</li>
      <li>Vendors: vendors@multicommerce.local</li>
    </ul>
  </InfoPage>
);

export const ReturnPolicyPage = () => (
  <InfoPage title="Return Policy">
    <p>Most products can be returned within 7 days of delivery if unused and in original packaging.</p>
    <h2>How returns work</h2>
    <ol>
      <li>Go to My Orders and select the delivered order.</li>
      <li>Choose Return and submit the reason.</li>
      <li>Pickup is scheduled or drop-off instructions are shared.</li>
      <li>Refund is processed after quality check.</li>
    </ol>
    <h2>Non-returnable items</h2>
    <ul>
      <li>Personal care / hygiene products once opened</li>
      <li>Digital gift cards</li>
      <li>Items marked as non-returnable on the product page</li>
    </ul>
  </InfoPage>
);

export const TermsPage = () => (
  <InfoPage title="Terms of Use">
    <p>
      By using MultiCommerce you agree to use the platform lawfully, provide accurate account
      information, and respect vendor and marketplace policies.
    </p>
    <h2>Accounts</h2>
    <p>You are responsible for keeping your login credentials secure and for activity under your account.</p>
    <h2>Orders</h2>
    <p>
      Order acceptance, pricing, and availability may change until confirmation. Vendors fulfill
      orders according to listed status flow.
    </p>
    <h2>Prohibited use</h2>
    <ul>
      <li>Fraudulent payments or fake reviews</li>
      <li>Abuse of promotions or referral systems</li>
      <li>Attempting to disrupt platform security</li>
    </ul>
  </InfoPage>
);

export const PrivacyPage = () => (
  <InfoPage title="Privacy Policy">
    <p>
      We collect account details, order history, and device information needed to run shopping,
      support, and security features.
    </p>
    <h2>How we use data</h2>
    <ul>
      <li>Process orders and payments status</li>
      <li>Send OTP, order, and password-reset emails</li>
      <li>Improve recommendations and store discovery</li>
      <li>Prevent fraud and enforce policies</li>
    </ul>
    <h2>Your choices</h2>
    <p>
      You can update profile details anytime from My Account. For data deletion requests email{" "}
      <strong>privacy@multicommerce.local</strong>.
    </p>
  </InfoPage>
);

export const ShippingPage = () => (
  <InfoPage title="Shipping">
    <p>Delivery timelines depend on the vendor store and your address.</p>
    <ul>
      <li>Standard delivery: 3–7 business days</li>
      <li>Express options may be shown at checkout when available</li>
      <li>Track shipment status from My Orders</li>
    </ul>
  </InfoPage>
);

export const CancellationPage = () => (
  <InfoPage title="Cancellation Policy">
    <p>You can cancel orders that are still in Pending or Confirmed status from My Orders.</p>
    <p>
      Once an order moves to Processing or Shipped, cancellation may not be available — use Return
      after delivery if eligible.
    </p>
  </InfoPage>
);

export const FAQPage = () => (
  <InfoPage title="FAQ">
    <h2>How do I track my order?</h2>
    <p>Open My Orders from the Account menu to see live status.</p>
    <h2>Can I buy from multiple stores in one order?</h2>
    <p>Checkout currently supports one store per order. Remove items from other stores first.</p>
    <h2>How do I reset my password?</h2>
    <p>Use Forgot Password on the login page to receive a reset link by email.</p>
    <h2>Where is my wishlist?</h2>
    <p>Account → Wishlist, or use the heart icon on product cards.</p>
  </InfoPage>
);

export const PaymentsHelpPage = () => (
  <InfoPage title="Payments">
    <p>
      Guests can browse products freely. Login is required to add to cart and checkout.
      Online payments are processed securely with Razorpay.
    </p>
    <ul>
      <li>UPI, cards, net banking, and wallets via Razorpay</li>
      <li>Cash on Delivery for pay-on-delivery orders</li>
      <li>Pending payments can be completed anytime from My Payments</li>
      <li>For payment issues contact support@multicommerce.local</li>
    </ul>
  </InfoPage>
);

export const AdvertisePage = () => (
  <InfoPage title="Advertise">
    <p>Grow your brand with MultiCommerce ads across homepage banners, category rails, and search.</p>
    <ul>
      <li>Sponsored product placements</li>
      <li>Category spotlight campaigns</li>
      <li>Seasonal festival packages</li>
    </ul>
    <p>
      Contact <strong>advertise@multicommerce.local</strong> to get a media kit.
    </p>
  </InfoPage>
);

export const DownloadAppPage = () => (
  <InfoPage title="Download App">
    <p>The MultiCommerce mobile app is coming soon for Android and iOS.</p>
    <ul>
      <li>Faster checkout and order tracking</li>
      <li>Push notifications for deals and delivery updates</li>
      <li>Wishlist sync across devices</li>
    </ul>
    <p>Meanwhile, continue shopping on the web at this site.</p>
  </InfoPage>
);

export const GiftCardsInfoPage = () => (
  <InfoPage title="Gift Cards">
    <p>Buy MultiCommerce gift cards for friends and family, or redeem one at checkout.</p>
    <ul>
      <li>Available in multiple denominations</li>
      <li>Valid across participating vendor stores</li>
      <li>Manage redeemed cards from My Account → Gift Cards</li>
    </ul>
  </InfoPage>
);

export const HelpCenterPage = () => (
  <InfoPage title="Help Center">
    <p>Find quick answers or reach support.</p>
    <ul>
      <li>
        <a href="/customer/info/faq">FAQ</a>
      </li>
      <li>
        <a href="/customer/info/shipping">Shipping help</a>
      </li>
      <li>
        <a href="/customer/info/returns">Returns help</a>
      </li>
      <li>
        <a href="/customer/info/payments">Payments help</a>
      </li>
      <li>
        <a href="/customer/info/contact">Contact support</a>
      </li>
    </ul>
  </InfoPage>
);

export const SitemapPage = () => (
  <InfoPage title="Sitemap">
    <h2>Shop</h2>
    <ul>
      <li>
        <a href="/customer">Home</a>
      </li>
      <li>
        <a href="/customer/products">Products</a>
      </li>
      <li>
        <a href="/customer/stores">Stores</a>
      </li>
      <li>
        <a href="/customer/cart">Cart</a>
      </li>
      <li>
        <a href="/customer/orders">Orders</a>
      </li>
    </ul>
    <h2>Account</h2>
    <ul>
      <li>
        <a href="/customer/account/profile">Profile</a>
      </li>
      <li>
        <a href="/customer/account/addresses">Addresses</a>
      </li>
      <li>
        <a href="/customer/account/wishlist">Wishlist</a>
      </li>
    </ul>
    <h2>Company</h2>
    <ul>
      <li>
        <a href="/customer/info/about">About Us</a>
      </li>
      <li>
        <a href="/customer/info/careers">Careers</a>
      </li>
      <li>
        <a href="/customer/info/privacy">Privacy</a>
      </li>
      <li>
        <a href="/customer/info/terms">Terms</a>
      </li>
    </ul>
  </InfoPage>
);

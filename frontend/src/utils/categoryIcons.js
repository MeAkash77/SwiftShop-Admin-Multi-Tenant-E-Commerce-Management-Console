/** Font Awesome icon class map for shop categories */
export const categoryIconMap = {
  electronics: "fa-solid fa-laptop",
  mobiles: "fa-solid fa-mobile-screen-button",
  fashion: "fa-solid fa-shirt",
  home: "fa-solid fa-house",
  appliances: "fa-solid fa-plug",
  beauty: "fa-solid fa-spa",
  sports: "fa-solid fa-dumbbell",
  books: "fa-solid fa-book",
  bags: "fa-solid fa-bag-shopping",
  toys: "fa-solid fa-puzzle-piece",
  default: "fa-solid fa-tags",
};

export function getCategoryIcon(slug) {
  return categoryIconMap[slug] || categoryIconMap.default;
}

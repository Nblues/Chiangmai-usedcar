// ===== Firebase (compat) init =====
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "https://couddaw-default-rtdb.firebaseio.com",
  projectId: "couddaw",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== Shopify Storefront API =====
const shopDomain = "www.kn-goodcar.com";
const storefrontToken = "bb70cb008199a94b83c98df0e45ada67";

// ดึงรถทั้งหมดจาก Shopify
async function fetchAllCars() {
  console.log('fetchAllCars called');
  const query = `{
    products(first: 100) {
      edges {
        node {
          id
          title
          images(first: 10) {
            edges { node { src altText } }
          }
          variants(first: 1) {
            edges { node { price } }
          }
        }
      }
    }
  }`;
  const res = await fetch(`https://${shopDomain}/api/2023-04/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontToken
    },
    body: JSON.stringify({ query })
  });
  const { data } = await res.json();
  return data.products.edges.map(e => e.node);
}

// ฟังก์ชันแสดงรายการรถ + pagination
let allCars = [];
let currentPage = 1;
const pageSize = 8;

function renderAllCars(cars) {
  console.log('renderAllCars', cars.length);
  const list = document.getElementById("product-list");
  list.innerHTML = "";
  const start = (currentPage - 1) * pageSize;
  const pageCars = cars.slice(start, start + pageSize);

  pageCars.forEach(car => {
    const card = document.createElement("div");
    card.className = "car-card";

    const thumb = car.images.edges[0].node;
    const img = document.createElement("img");
    img.src = thumb.src;
    img.alt = thumb.altText || car.title;
    img.loading = "lazy";
    card.appendChild(img);

    const title = document.createElement("h2");
    title.textContent = car.title;
    card.appendChild(title);

    const price = document.createElement("p");
    price.textContent = `ราคา ${car.variants.edges[0].node.price} บาท`;
    card.appendChild(price);

    const a = document.createElement("a");
    a.href = `car-detail.html?carId=${encodeURIComponent(car.id)}`;
    a.textContent = "ดูรายละเอียด";
    card.appendChild(a);

    list.appendChild(card);
  });

  renderPagination(cars.length);
}

// สร้างปุ่ม pagination
function renderPagination(totalItems) {
  console.log('renderPagination totalItems=', totalItems);
  const pages = Math.ceil(totalItems / pageSize);
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = (i === currentPage) ? "active-page" : "";
    btn.onclick = () => {
      currentPage = i;
      applyFilters();
    };
    container.appendChild(btn);
  }
}

// ฟังก์ชันกรอง
function applyFilters() {
  console.log('applyFilters called');
  const brand = document.getElementById("filter-brand").value.toLowerCase();
  const keyword = document.getElementById("filter-keyword").value.toLowerCase();
  let filtered = allCars;

  if (brand) filtered = filtered.filter(car => car.title.toLowerCase().includes(brand));
  if (keyword) filtered = filtered.filter(car => car.title.toLowerCase().includes(keyword));

  currentPage = 1;
  renderAllCars(filtered);
}

// view counter
function incrementViewCount(carId) {
  const ref = db.ref(`views/${encodeURIComponent(carId)}`);
  ref.transaction(v => (v || 0) + 1);
}

(async () => {
  console.log('script.js loaded');
  allCars = await fetchAllCars();
  applyFilters();
})();
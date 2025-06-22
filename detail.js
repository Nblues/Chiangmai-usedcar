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

async function fetchCarDetail(carId) {
  console.log('fetchCarDetail', carId);
  const query = `query {
    node(id: "${carId}") {
      ... on Product {
        id
        title
        description
        images(first: 10) {
          edges { node { src altText } }
        }
        variants(first: 1) {
          edges { node { price } }
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
  return data.node;
}

function renderDetail(car) {
  console.log('renderDetail', car);
  document.getElementById("car-title").textContent = car.title;
  document.getElementById("car-desc").textContent = car.description;
  document.getElementById("car-price").textContent = `ราคา ${car.variants.edges[0].node.price} บาท`;

  const gallery = document.getElementById("car-images");
  car.images.edges.forEach(imgEdge => {
    const img = document.createElement("img");
    img.src = imgEdge.node.src;
    img.alt = imgEdge.node.altText || car.title;
    img.loading = "lazy";
    gallery.appendChild(img);
  });

  const ref = db.ref(`views/${encodeURIComponent(car.id)}`);
  ref.transaction(v => (v || 0) + 1);
}

(async () => {
  console.log('detail.js loaded');
  const params = new URLSearchParams(window.location.search);
  const carId = params.get("carId");
  if (!carId) {
    console.error('No carId provided in URL');
    return;
  }
  const car = await fetchCarDetail(carId);
  renderDetail(car);
})();
const container = document.getElementById("professionals");

db.collection("professionals")
.where("approved", "==", true)
.onSnapshot(snapshot => {

  container.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();

    container.innerHTML += `
      <div class="card">
        <h3>${data.name}</h3>
        <p>${data.profession}</p>
        <p>${data.location}</p>
        <div class="rating">⭐ ${data.rating || 0}</div>
      </div>
    `;
  });

});

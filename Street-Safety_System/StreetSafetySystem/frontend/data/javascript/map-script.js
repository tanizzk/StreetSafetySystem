// 1. Initialize map
var map = L.map('map').setView([0, 0], 2);

// 2. Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 3. Enable user location tracking
map.locate({ setView: true, maxZoom: 16, watch: true });

// 4. Marker for user location
var userMarker, accuracyCircle;

// Haversine distance function (km)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2-lat1) * Math.PI / 180;
    const dLon = (lon2-lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1*Math.PI/180) *
              Math.cos(lat2*Math.PI/180) *
              Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Load crime points from backend
function loadCrimeData(userLat, userLng) {
    fetch("http://localhost:3000/mapdata")
        .then(res => res.json())
        .then(crimeData => {
            // Remove old markers first
            map.eachLayer(layer => {
                if (layer.options && layer.options.radius) {
                    map.removeLayer(layer);
                }
            });

            // Re-add user marker and circle
            if (userMarker && accuracyCircle) {
                userMarker.addTo(map);
                accuracyCircle.addTo(map);
            }

            // Add only points within 3 km
            crimeData.forEach(crime => {
                const distance = getDistance(userLat, userLng, crime.lat, crime.lng);
                if (distance <= 3) {
                    let color = crime.risk === 'high' ? 'red' :
                                crime.risk === 'medium' ? 'orange' : 'green';
                    L.circleMarker([crime.lat, crime.lng], {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.7,
                        radius: 8
                    }).addTo(map)
                      .bindPopup(`<b>${crime.type}</b><br>${crime.warning}`);
                }
            });
        })
        .catch(err => console.error("Error loading crime data:", err));
}

// Handle location found
function onLocationFound(e) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;
  const accuracy = e.accuracy;

  if (userMarker) {
    userMarker.setLatLng([lat, lng]);
    accuracyCircle.setLatLng([lat, lng]).setRadius(accuracy);
  } else {
    userMarker = L.marker([lat, lng]).addTo(map)
      .bindPopup("You are here").openPopup();
    accuracyCircle = L.circle([lat, lng], { radius: accuracy }).addTo(map);
  }

  // Load points within 3km
  loadCrimeData(lat, lng);

  // Submit new hazard
  document.getElementById("submit-crime")?.addEventListener("click", () => {
    const type = document.getElementById("crime-type").value;
    const risk = document.getElementById("crime-risk").value;
    const warning = document.getElementById("crime-warning").value;

    if (!type || !risk || !warning) {
      alert("Please fill in all fields!");
      return;
    }

    fetch("http://localhost:3000/mapdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, type, risk, warning })
    })
    .then(() => {
        console.log("📦 Hazard submitted!");
        // Clear form
        document.getElementById("crime-type").value = "";
        document.getElementById("crime-risk").value = "low";
        document.getElementById("crime-warning").value = "";
        // Reload map points
        loadCrimeData(lat, lng);
    })
    .catch(err => console.error(err));
  });
}

// Handle location errors
function onLocationError(e) {
  alert("Location access denied or unavailable.");
}

// Leaflet events
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

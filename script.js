document.addEventListener('DOMContentLoaded', () => {
    const locationElement = document.getElementById('location');
    const dateElement = document.getElementById('date');
    const prayerTimesTableBody = document.querySelector('#prayer-times tbody');
    const adhanAudio = document.getElementById('adhan-audio');

    // Prayer name mapping for display
    const prayerNames = {
        Fajr: 'Subuh',
        Dhuhr: 'Dzuhur',
        Asr: 'Ashar',
        Maghrib: 'Maghrib',
        Isha: 'Isya'
    };

    // Function to format date
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('id-ID', options);

    // 1. Get user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(fetchPrayerTimes, handleLocationError);
    } else {
        locationElement.textContent = "Geolocation tidak didukung oleh browser ini.";
    }

    function handleLocationError(error) {
        locationElement.textContent = "Gagal mendapatkan lokasi. Izinkan akses lokasi.";
        console.error("Geolocation error:", error);
    }

    async function fetchPrayerTimes(position) {
        const { latitude, longitude } = position.coords;

        // Fetch city name using a reverse geocoding API
        try {
            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const geoData = await geoResponse.json();
            const city = geoData.address.city || geoData.address.town || geoData.address.village || 'Lokasi Anda';
            locationElement.textContent = city;
        } catch (error) {
            locationElement.textContent = 'Tidak dapat mengambil nama kota.';
            console.error('Error fetching city name:', error);
        }

        // 2. Fetch prayer times from Aladhan API
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        // Method 2: Islamic Society of North America (ISNA)
        const prayerAPI = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=2`;

        try {
            const response = await fetch(prayerAPI);
            const data = await response.json();
            const timings = data.data.timings;
            displayPrayerTimes(timings);
            scheduleAdhanChecks(timings);
        } catch (error) {
            console.error("Error fetching prayer times:", error);
            prayerTimesTableBody.innerHTML = '<tr><td colspan="2">Gagal memuat waktu sholat.</td></tr>';
        }
    }

    function displayPrayerTimes(timings) {
        prayerTimesTableBody.innerHTML = ''; // Clear previous data
        for (const prayer in prayerNames) {
            if (timings[prayer]) {
                const row = document.createElement('tr');
                const prayerCell = document.createElement('td');
                const timeCell = document.createElement('td');

                prayerCell.textContent = prayerNames[prayer];
                timeCell.textContent = timings[prayer];

                row.appendChild(prayerCell);
                row.appendChild(timeCell);
                prayerTimesTableBody.appendChild(row);
            }
        }
    }

    function scheduleAdhanChecks(timings) {
        // Add a one-time interaction to enable audio playback
        document.body.addEventListener('click', () => {
            adhanAudio.play();
            adhanAudio.pause();
            console.log("Audio playback enabled by user interaction.");
        }, { once: true });

        setInterval(() => {
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

            for (const prayer in prayerNames) {
                if (timings[prayer] === currentTime) {
                    console.log(`Waktu ${prayerNames[prayer]} telah tiba!`);
                    playAdhan();
                }
            }
        }, 1000 * 30); // Check every 30 seconds to be efficient
    }

    function playAdhan() {
        adhanAudio.play().catch(error => {
            console.error("Gagal memutar adzan:", error);
            // This usually happens if the user hasn't interacted with the page yet.
            alert("Waktu sholat telah tiba! Klik di mana saja di halaman untuk mengaktifkan suara adzan.");
        });
    }
});
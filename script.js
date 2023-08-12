const firebaseConfig = {
    apiKey: "AIzaSyAcINU2KIYxsV2WZVTTaZ3tnIXESVOSsWQ",
    authDomain: "dsplayz.firebaseapp.com",
    databaseURL: "https://dsplayz-default-rtdb.firebaseio.com/",
    projectId: "dsplayz",
    storageBucket: "dsplayz.appspot.com",
    messagingSenderId: "565599758200",
    appId: "1:565599758200:web:4f09f33c2565b5d2528a8d",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference to the Realtime Database
const database = firebase.database();

document.addEventListener("DOMContentLoaded", function () {
    const redeemBtn = document.getElementById('redeemBtn');
    const prizeDisplay = document.getElementById('prize');
    const cooldownToast = document.getElementById('cooldownToast');
    let toastTimeout;
    let lastRedeemTime = 0; // Timestamp of the last redemption

    const validCodes = {
        "winRbx-qu85i7": "10",
        "winRbx-ab12cd": "15",
        "winRbx-ef34gh": "20",
        "winRbx-ij56kl": "5",
        "winRbx-mn78op": "30",
        "winRbx-qr90st": "25",
        "winRbx-uv12wx": "10",
    };

    redeemBtn.addEventListener("click", async function () {
        const currentTime = Date.now();
        const cooldownTime = 15000; // Cooldown time in milliseconds (10 seconds)
        
        if (currentTime - lastRedeemTime < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - (currentTime - lastRedeemTime)) / 1000);
            showToast(`Too fast, please slow down. Try again in ${remainingTime} seconds.`, "black");
            return;
        }

        const scInput = document.getElementById('scInput').value;
        const usernameInput = document.getElementById('passwordInput').value;

        if (!usernameInput) {
            showToast("Please enter a username", "black");
            clearPrize();
            return;
        }

        if (!scInput) {
            showToast("Please enter a code", "black");
            clearPrize();
            return;
        }

        if (validCodes.hasOwnProperty(scInput)) {
            try {
                const redemptionStatus = await checkCodeRedemption(scInput);

                if (redemptionStatus) {
                    showToast("Code has already been redeemed", "red");
                    clearPrize();
                } else {
                    lastRedeemTime = currentTime; // Update last redemption time
                    await redeemCode(scInput);
                    showToast(`Code redeemed successfully! You've received ${validCodes[scInput]} Robux. Your Robux will be transferred within 24 hours.`, "green");
                }
            } catch (error) {
                showToast("An error occurred", "red");
                console.error(error);
            }
        } else {
            showToast("This Code is invalid", "black");
            clearPrize();
        }
    });

    async function checkCodeRedemption(code) {
        const snapshot = await database.ref('redeemedCodes').child(code).once('value');
        return snapshot.val() === true;
    }

    async function redeemCode(code) {
        await database.ref('redeemedCodes').child(code).set(true);
    }

    function showToast(text, color) {
        const toast = document.getElementById("toast");
        toast.textContent = text;
        toast.style.backgroundColor = color;

        if (!toast.classList.contains("show")) {
            toast.classList.add("show");

            toastTimeout = setTimeout(() => {
                toast.classList.remove("show");
            }, 2000); // Adjust the time as needed (in milliseconds)
        }
    }

    function clearPrize() {
        prizeDisplay.textContent = "";
    }
});
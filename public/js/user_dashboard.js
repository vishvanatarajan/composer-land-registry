var validationInterval = null;

async function initiateFingerprintValidation(landId, aadhaar) {
    const initiateFingerprintAPI = "http://localhost:4200/users/fingerprint/initiate?sellerAadhaar=" + aadhaar + "&landId=" + landId;

    fetch(initiateFingerprintAPI);

    Swal.fire({
        title: 'Awaiting Fingerprint Validation',
        onOpen: () => {
            swal.showLoading()
        },
        allowOutsideClick: () => !Swal.isLoading()
    });

    let promise = new Promise((resolve, reject) => {
        validationInterval = setInterval(function() { checkFingerprintValidation(landId, aadhaar, resolve) }, 1000);
    });

    const retVal = await promise;

    if (retVal) {
        Swal.fire("Success", "Fingerprint validated", "success").then((result) => {
            if (result.value) {
                renderEjs('users/property/sell');
            }
        })
    }
}

function checkFingerprintValidation(landId, aadhaar, resolve) {
    $.ajax({
        type: 'GET',
        url: 'http://localhost:4200/users/fingerprint/check',
        data: { aadhaar: aadhaar, landId: landId },
        success: function(response) {
            console.log(response.validated);
            if (response.validated) {
                resolve("done");
                clearInterval(validationInterval);
            }
        },
        error: function(response) {
            console.log("Something went wrong");
        }
    });
}
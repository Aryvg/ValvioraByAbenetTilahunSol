// Define the async function separately

import { getAccessToken } from './auth.js';



export async function uploadEmployee() {

    const formData = new FormData();

    const channelname = document.getElementById('cName');

    const channelType = document.getElementById('cType');

    const Description = document.getElementById('cDesc');

    const profilePicture = document.getElementById('cPfp');

    const channelBanner = document.getElementById('cBanner');

    const contactEmail = document.getElementById('cContact');







    formData.append('channelname', channelname?.value || '');

    formData.append('channelType', channelType?.value || '');

    formData.append('Description', Description?.value || '');

    formData.append('contactEmail', contactEmail?.value || '');

    // Only append the actual File objects (do not append filename strings)
    if (profilePicture?.files?.[0]) formData.append('profilePicture', profilePicture.files[0]);
    if (channelBanner?.files?.[0]) formData.append('channelBanner', channelBanner.files[0]);







    const token = await getAccessToken();



    try {

        const response = await fetch('https://valviorabackend2.onrender.com/channelApi', {

            method: 'POST',

            headers: {

                'Authorization': 'Bearer ' + token

            },// send the token

            body: formData// send the container

        });



        if (!response.ok) {

            let errorMsg = 'Failed to create employee';

            try {

                const errData = await response.json();

                if (errData && errData.message) errorMsg = errData.message;

            } catch { }

            alert(errorMsg);

            return;

        }



        // alert('channel created!');

        window.location.href = 'dashboard.html';

    } catch (error) {

        console.error('Error uploading employee:', error);

        alert('An error occurred while creating employee: ' + error.message);

    }

}


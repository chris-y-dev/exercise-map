//Get dom elements
const form = document.getElementById('form')
const inputType = document.getElementById("inputType")
const inputDuration = document.getElementById('inputDuration')
const inputDistance = document.getElementById('inputDistance')
const inputNotes = document.getElementById('inputNotes')
const inputElevation = document.getElementById('inputElevation')
const inputSport = document.getElementById('inputSport')
//Create App class

//Activity Class

//class objects


//Global Variables
let map;
let mapEvent;



//retrieve coordinates
if(navigator.geolocation){   
    navigator.geolocation.getCurrentPosition(function(position){
        const {latitude} = position.coords
        const {longitude} = position.coords
        const coords = [latitude, longitude]
        

        //render the map
        map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        L.marker(coords).addTo(map)
            .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
            .openPopup();

        //set marker at clicked coordinates
        map.on('click', function(mapClick){
            mapEvent =  mapClick;
            console.log(mapEvent);
            //  retrieve coordinates
         
           

            //show form on click
            form.classList.remove('hidden')
            inputDuration.focus();
           
            //add marker
        


            //submit form to add marker

        })


    }, function(){
        alert('Unable to retrieve your geolocation')
    })
}
    
//set marker at submit form
form.addEventListener('submit', function(e){ 
    e.preventDefault();  

    //add marker
    const {lat} = mapEvent.latlng;
    const {lng} = mapEvent.latlng;
    console.log(lat, lng);
    L.marker([lat, lng]).addTo(map)
    .bindPopup(
        L.popup({
            maxWidth: 350,
        })
    ).setPopupContent('Popup added')
    .openPopup();


    inputDuration.value = inputDistance.value = inputNotes.value = inputElevation.value = '';
    form.classList.add('hidden')
})

//change for fields depending on type value
inputType.addEventListener('change', function(){
    console.log(inputType.value);

    if (inputType.value === 'sport') {
        inputElevation.closest('.input-row').classList.add('hidden');
        inputDistance.closest('.input-row').classList.add('hidden');
        inputSport.closest('.input-row').classList.remove('hidden');
    }

    if (inputType.value === 'cycle') {
        inputElevation.closest('.input-row').classList.remove('hidden');
    }
    if (inputType.value === 'walk'){
        inputElevation.closest('.input-row').classList.add('hidden');
    }
    if (inputType.value ==='run'){
        inputElevation.closest('.input-row').classList.remove('hidden');
    }

})





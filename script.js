//Get dom elements
const form = document.getElementById('form')
const inputType = document.getElementById("inputType")
const inputDuration = document.getElementById('inputDuration')
const inputDistance = document.getElementById('inputDistance')
const inputNotes = document.getElementById('inputNotes')
const inputElevation = document.getElementById('inputElevation')
const inputSport = document.getElementById('inputSport')
//Create App class

///////////////App logic - Code Architecture
//Activity Class
class App {
    //public field
    map;
    mapEvent;
    exercises = [];

    //mandatory constructor - These will be set immediately upon app load
    constructor(){
        this._getPosition();
    
        //set marker at submit form
        form.addEventListener('submit', this._submitForm.bind(this))
        //change for fields depending on type value
        inputType.addEventListener('change', this._changeForm.bind(this)) 
    }

    //methods
    _getPosition(){
        if(navigator.geolocation){   
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
                alert('Unable to retrieve your geolocation')
        })
        }
    }
    _loadMap(position){

        //retrieve coordinates
        const {latitude} = position.coords
        const {longitude} = position.coords
        const coords = [latitude, longitude]
        
        //render the map
        this.map = L.map('map').setView(coords, 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        
        //Click to create marker on clicked coordinates
        this.map.on('click', this._showForm.bind(this))
    }

    //retrieve coordinates from mapEvent + set markers at form submit
    _submitForm(e){
        
        //function to check every input
        const validInput = (...values) =>
        (values.every((value) =>
            Number.isFinite(value)
        ))
        
        //Function to check positive integer
        const positiveInt = (...values) => 
            (values.every((value) => value > 0))
        e.preventDefault();  
        
        //add marker
        const {lat} = this.mapEvent.latlng;
        const {lng} = this.mapEvent.latlng;
        console.log(lat, lng);
        L.marker([lat, lng]).addTo(this.map)
        .bindPopup(
            L.popup({
                maxWidth: 350,
            })
        ).setPopupContent('Popup added')
        .openPopup();

        //Validation messages
        const notInteger = 'Data fields can only contain integers'
        const notPositiveInt = 'Duration and Distance fields must contain positive integers'

        //form validation
        const type = inputType.value;
        const notes = inputNotes.value;
        const duration = +inputDuration.value;
        let exercise;

        //check which data is saved
        if (type === "walk"){
            const distance = +inputDistance.value

            if (!validInput(duration, distance)){
                return alert(notInteger)
            }
            if (!positiveInt(duration, distance)){
                return alert(notPositiveInt)
            }

            exercise = new Walk(distance, duration, notes)
        }

        if (type === "run" || type === "cycle"){
            const distance = +inputDistance.value
            const elevation = +inputElevation.value

            if (!validInput(duration, distance, elevation)){
                return alert(notInteger)
            }
            if (!positiveInt(duration, distance)){
                return alert(notPositiveInt)
            }

            if (type==='run'){
                exercise = new Run(distance, duration, elevation, notes)
            }

            if (type==='cycle'){
                exercise = new Cycle(distance, duration, elevation, notes)
            }
        }

        if (type === "sport"){
            const sportName = inputSport.value

            if (!validInput(duration)){
                return alert(notInteger)
            }
            if (!positiveInt(duration)){
                return alert(notPositiveInt)
            }

            exercise = new Sport(duration, sportName, notes)
        }

        //Save new class obj to public Array
        this.exercises.push(exercise)
        console.log(this.exercises);

        //Reset + close form
        this._clearFormFields();
        form.classList.add('hidden')
    }

    //Change input fields depending on type of exercise
    _changeForm(){
        console.log(inputType.value);

        if (inputType.value === 'walk'){
            inputDistance.closest('.input-row').classList.remove('hidden');
            inputElevation.closest('.input-row').classList.add('hidden');
            inputSport.closest('.input-row').classList.add('hidden');
        }
        if (inputType.value ==='run' || inputType.value === 'cycle'){
            inputDistance.closest('.input-row').classList.remove('hidden');
            inputElevation.closest('.input-row').classList.remove('hidden');
            inputSport.closest('.input-row').classList.add('hidden');   
        }

        if (inputType.value === 'sport') {
            inputElevation.closest('.input-row').classList.add('hidden');
            inputDistance.closest('.input-row').classList.add('hidden');
            inputSport.closest('.input-row').classList.remove('hidden');
        }

        this._clearFormFields();
    }

    //show form + update map variable with mapEvent
    _showForm(mapClick){
        this.mapEvent =  mapClick;  

        //show form on click
        form.classList.remove('hidden')
        inputDuration.focus();
    }

    _clearFormFields(){
        //Reset form fields after submission
        inputDuration.value = inputDistance.value = inputNotes.value = inputElevation.value = inputSport.value = '';
    }

    _renderExercisePanel(exercise){
        const insertObj = exercise;

        form.insertAdjacentElement('afterend', 
        `<li>
            <div class="exercisePanel">
                <h2>${exercise.type}</h2>
                <div>
                    <span>⚽</span>
                    <span>Soccer</span>
                    <span>km</span>
                </div>
                <div>
                    <span>⌚</span>
                    <span>${exercise.duration}</span>
                    <span>min</span>
                </div>
                <div>
                    <span>Speed/Pace</span>
                    <span>5.7</span>
                    <span>km/min</span>
                </div>
                <div>
                    <span>📝</span>
                    <span>${exercise.notes}</span>
                </div>
            </div>
        </li>
        `
        
        )
    }



}
//class objects

///////Exercise class
// Exercise classes
class Exercise {
//public field
date = new Date();

//constructor
    constructor(duration, notes){
        this.duration = duration;
        this.notes = notes;
    }
}

//Child classes
class Walk extends Exercise {
    type = 'walk';
    constructor(distance, duration, notes){
        super(duration, notes)
        this.distance = distance;
    }

}

class Run extends Exercise {
    type = 'run';
    constructor(distance, duration, elevation, notes){
        super(duration, notes)
        this.distance = distance;
        this.elevation = elevation
    }

}


class Cycle extends Exercise {
    type = 'cycle';
    constructor(distance, duration, elevation, notes){
        super(duration, notes)
        this.distance = distance;
        this.elevation = elevation
    }

}

class Sport extends Exercise {
    type = 'sport';
    constructor(duration, sport, notes){
        super(duration, notes)
        this.sport = sport;
    }

}


const app = new App;


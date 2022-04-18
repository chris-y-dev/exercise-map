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
        ////////Form validation
        const type = inputType.value;
        const notes = inputNotes.value;
        const duration = +inputDuration.value;
        let exercise;
        
        //function to check every input
        const validInput = (...values) =>
        (values.every((value) =>
            Number.isFinite(value)
        ))
        
        //Function to check positive integer
        const positiveInt = (...values) => 
            (values.every((value) => value > 0))
        e.preventDefault();  

        //Validation messages
        const notInteger = 'Data fields can only contain integers'
        const notPositiveInt = 'Duration and Distance fields must contain positive integers'

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
            console.log(exercise);
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
            const sportName = inputSport.value.toLowerCase();

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

        //////////Add marker
        this._createPopupDescription.bind(this)
        const {lat} = this.mapEvent.latlng;
        const {lng} = this.mapEvent.latlng;
        console.log(lat, lng);
        L.marker([lat, lng]).addTo(this.map)
        .bindPopup(
            L.popup({
                maxWidth: 350,
                className: `popup--${type}`
            })
        ).setPopupContent(this._createPopupDescription(exercise))
        .openPopup();

        


        //Reset + close form
        this._clearFormFields();
        form.classList.add('hidden');

        this._renderExercisePanel(exercise);

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
        let htmlContent =  
        `<li>
        <div class="exercisePanel">
            <h2>${exercise.emoji} ${this._capitaliseWord(exercise.type)}</h2>
            <div>
                <span>📏Dist.: </span>
                <span>${exercise.distance}</span>
                <span>km</span>
            </div>
            <div>
                <span>⏲Time: </span>
                <span>${exercise.duration}</span>
                <span>min</span>
            </div>
            <div>
                <span>💨Speed</span>
                <span>${this._calcSpeed(exercise)}</span>
                <span>km/h</span>
            </div>`

        if (exercise.type ==='run' || exercise.type ==='cycle'){
            const elevGainAndSpeed = `
            <div>
                <span>🗻Elev.: </span>
                <span>${exercise.elevation}</span>
                <span>m</span>
            </div>`

            htmlContent += elevGainAndSpeed
        };

        if (exercise.type ==='sport') {
            htmlContent = 
            `<li>
            <div class="exercisePanel">
                <h2>${exercise.emoji} ${this._capitaliseWord(exercise.sportName)}</h2>
                <div>
                    <span>⌚Time: </span>
                    <span>${exercise.duration}</span>
                    <span>min</span>
                </div>`
        };

        if (exercise.notes !== ''){
            htmlContent +=
            `<div>
            <span>📝Notes: </span>
            <span>${exercise.notes}</span>
            </div>
            </div>
            </li>`
        }
            
        

        form.insertAdjacentHTML('afterend', htmlContent);
    }

    _calcSpeed(exercise){
        return (exercise.distance / (exercise.duration/60)).toFixed(2)
    }

    _capitaliseWord(string){
        let capString;
        return capString = string[0].toUpperCase() + string.slice(1).toLowerCase()
    }

    _createPopupDescription(exercise){
        let options = {day:'numeric', month: 'numeric', year: 'numeric', }
        return `${exercise.emoji} ${(exercise.type==='sport')? this._capitaliseWord(exercise.sportName) : this._capitaliseWord(exercise.type)}, ${exercise.date.toLocaleString('en-GB', options)}`
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
    //Prototype methods for all Class objects to use
    _getEmoji(exercise){
        let emoji;
        switch(exercise){
            case "walk":
                emoji = '🚶‍♂️';
                break;
            case "run":
                emoji = '🏃‍♂️'
                break;
            case "cycle":
                emoji = '🚲';
                break;
            case "sport":
                switch(this.sportName){
                    case "soccer":
                    case "football":
                        emoji = '⚽'
                        break;
                    case "basketball":
                        emoji = '🏀';
                        break;
                    case "hockey":
                    emoji = '🏑'
                        break;
                    case "tennis":
                    emoji = '🎾';
                    break;
                    case "badminton":
                        emoji = '🏸'
                        break;
                    case "gym":
                    case "workout":
                        emoji = '💪';
                        break;
                    case "swimming":
                    case "swim":
                        emoji = '🏊‍♂️'
                        break;
                    default:
                        emoji = '🏅'
                        break;
                }
                break;
            default: 
                emoji = '🏅'
                break;
        }
        return emoji
    }

}

//Child classes
class Walk extends Exercise {
    type = 'walk';
    constructor(distance, duration, notes){
        super(duration, notes)
        this.distance = distance;
        this.emoji = this._getEmoji(this.type)
    }

}

class Run extends Exercise {
    type = 'run';
    constructor(distance, duration, elevation, notes){
        super(duration, notes)
        this.distance = distance;
        this.elevation = elevation
        this.emoji = this._getEmoji(this.type)
    }

}


class Cycle extends Exercise {
    type = 'cycle';
    constructor(distance, duration, elevation, notes){
        super(duration, notes)
        this.distance = distance;
        this.elevation = elevation
        this.emoji = this._getEmoji(this.type)
    }

}

class Sport extends Exercise {
    type = 'sport';
    constructor(duration, sportName, notes){
        super(duration, notes)
        this.sportName = sportName;
        this.emoji = this._getEmoji(this.type)
    }

}


const app = new App;


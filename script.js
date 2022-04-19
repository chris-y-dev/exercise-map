//Get dom elements
const form = document.getElementById('form')
const inputType = document.getElementById("inputType")
const inputDuration = document.getElementById('inputDuration')
const inputDistance = document.getElementById('inputDistance')
const inputNotes = document.getElementById('inputNotes')
const inputElevation = document.getElementById('inputElevation')
const inputSport = document.getElementById('inputSport')
const sidebarContainer = document.getElementById('panels-container')
const formCloseButton = document.getElementById('form-close-button')
//Create App class

///////////////App logic - Code Architecture
//Activity Class
class App {
    //public field
    map;
    mapEvent;
    exercises = [];
    data;

    //mandatory constructor - These will be set immediately upon app load
    constructor(){
        this._getPosition();
    
        //set marker at submit form
        form.addEventListener('submit', this._submitForm.bind(this))
        formCloseButton.addEventListener('click', function(e){
            form.classList.add('hidden');
        })

        //change for fields depending on type value
        inputType.addEventListener('change', this._changeForm.bind(this))
        //event listner for exercise panels
        sidebarContainer.addEventListener('click', this._moveToClickedPanel.bind(this))

        //retrieve data at start from localstorage
        this._retrieveLocalStorage();
        this._recreateExerciseObjs();
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

        //Recreate markers for parsed data
        this._recreateDataMarkers();

    }

    //retrieve coordinates from mapEvent + set markers at form submit
    _submitForm(e){
        ////////Form validation
        const type = inputType.value;
        const notes = inputNotes.value;
        const duration = +inputDuration.value;
        let exercise;
        const coords = this.mapEvent.latlng
        
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

            exercise = new Walk(coords, distance, duration, notes)
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
                exercise = new Run(coords, distance, duration, elevation, notes)
            }

            if (type==='cycle'){
                exercise = new Cycle(coords, distance, duration, elevation, notes)
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

            exercise = new Sport(coords, duration, sportName, notes)
        }

        //Save new class obj to public Array (adds onto Array parsed from LocalStorage)
        this.exercises.push(exercise)
        console.log(this.exercises);

        //Save updated Array to LocalStorage
        this._saveLocalStorage();

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
            }).setLatLng([lat,lng])
        )
        .setPopupContent(this._createPopupDescription(exercise))
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
        <div class="exercisePanel exercise-panel-${exercise.type}" data-id="${exercise.id}">
            <h2>${exercise.emoji} ${this._capitaliseWord(exercise.type)}</h2>
            <div>
                <span class="panel-category">📏Dist.: </span>
                <span>${exercise.distance}</span>
                <span>km</span>
            </div>
            <div>
                <span class="panel-category">⏲Time: </span>
                <span>${exercise.duration}</span>
                <span>min</span>
            </div>
            <div>
                <span class="panel-category">💨Speed: </span>
                <span>${this._calcSpeed(exercise)}</span>
                <span>km/h</span>
            </div>`

        if (exercise.type ==='run' || exercise.type ==='cycle'){
            const elevGainAndSpeed = `
            <div>
                <span class="panel-category">🗻Elev.: </span>
                <span>${exercise.elevation}</span>
                <span>m</span>
            </div>`

            htmlContent += elevGainAndSpeed
        };

        if (exercise.type ==='sport') {
            htmlContent = 
            `<li>
            <div class="exercisePanel exercise-panel-${exercise.type} data-id="${exercise.id}">
                <h2>${exercise.emoji} ${this._capitaliseWord(exercise.sportName)}</h2>
                <div>
                    <span class="panel-category">⌚Time: </span>
                    <span>${exercise.duration}</span>
                    <span>min</span>
                </div>`
        };

        if (exercise.notes !== ''){
            htmlContent +=
            `<div>
            <span class="panel-category">📝Notes: </span>
            <span>${exercise.notes}</span>
            </div>
            </div>
            </li>`
        }
            
        
        //inset Exercise Panel
        form.insertAdjacentHTML('afterend', htmlContent);
    }

    _calcSpeed(exercise){
        return (exercise.distance / (exercise.duration/60)).toFixed(1)
    }

    _capitaliseWord(string){
        let capString;
        return capString = string[0].toUpperCase() + string.slice(1).toLowerCase()
    }

    _createPopupDescription(exercise){
        let options = {day:'numeric', month: 'numeric', year: 'numeric', }
        return `${exercise.emoji} ${(exercise.type==='sport')? this._capitaliseWord(exercise.sportName) : this._capitaliseWord(exercise.type)}, ${exercise.date.toLocaleString('en-GB', options)}`
    }

    _moveToClickedPanel(e){
        //Identify which panel is clicked using closest CSS class
        const exercisePanel = e.target.closest('.exercisePanel')
        if (!exercisePanel) return;
        //retrieve ID of element using HTML attribute assigned
        const panelId = exercisePanel.getAttribute('data-id');

        //serach in array for matching ID
        const foundExerciseObj = this.exercises.find(exercise => exercise.id === panelId)
        console.log(foundExerciseObj);

        //Retrieve coordinates from found object
        const {lat, lng} = foundExerciseObj.coords;

        //setview to the found object
        this.map.setView([lat,lng], 13, {
            'animate': true,
            'pan': {
                'duration': 1
            }
        })
    }

    _saveLocalStorage(){
        localStorage.setItem('exercises', JSON.stringify(this.exercises))
    }

    _retrieveLocalStorage(){
        this.data = JSON.parse(localStorage.getItem('exercises'));
        console.log(this.data);
    }

    _recreateExerciseObjs(){
        let exerciseObj
        const dataObjArray = [];

        //Recreate Class objects for every object retrieved from Local Storage
        this.data.forEach(function(object){
            console.log(object.type);

            if (object.type === 'walk'){
                exerciseObj = new Walk(object.coords, object.distance, object.duration, object.notes)
            }
            if (object.type === 'run'){
                exerciseObj = new Run(object.coords, object.distance, object.duration, object.elevation, object.notes)
            }
            if (object.type === 'cycle'){
                exerciseObj = new Cycle(object.coords, object.distance, object.duration, object.elevation, object.notes)
            }
            if (object.type === 'sport'){
                exerciseObj = new Sport(object.coords, object.duration, object.sportName, object.notes)
            }
            dataObjArray.push(exerciseObj)
        })
        console.log(dataObjArray);
        
        // setting it to exercises, now they are clickable for setPan. Form submits adds to this.
        this.exercises = dataObjArray

    }

    _recreateDataMarkers(){
        console.log(this.exercises);
        console.log(this.map);
        this.exercises.forEach(exercise => {
            const {lat} = exercise.coords;
            const {lng} = exercise.coords;
            this._renderExercisePanel(exercise);
            L.marker([lat,lng]).addTo(this.map)
            .bindPopup(
                L.popup({
                    maxWidth: 350,
                    className: `popup--${exercise.type}`
                }).setLatLng([lat,lng])
                )
                .setPopupContent(this._createPopupDescription(exercise))  
            })
    }

}
//class objects

///////Exercise class
// Exercise classes
class Exercise {
//public field
date = new Date();
//generate random id
id = String(Date.now()) + String(Math.trunc(Math.random()*9999))

    //constructor
    constructor(coords, duration, notes){
        this.coords = coords
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
    constructor(coords, distance, duration, notes){
        super(coords, duration, notes)
        this.distance = distance;
        this.emoji = this._getEmoji(this.type)
    }

}

class Run extends Exercise {
    type = 'run';
    constructor(coords, distance, duration, elevation, notes){
        super(coords, duration, notes)
        this.distance = distance;
        this.elevation = elevation
        this.emoji = this._getEmoji(this.type)
    }

}


class Cycle extends Exercise {
    type = 'cycle';
    constructor(coords, distance, duration, elevation, notes){
        super(coords, duration, notes)
        this.distance = distance;
        this.elevation = elevation
        this.emoji = this._getEmoji(this.type)
    }

}

class Sport extends Exercise {
    type = 'sport';
    constructor(coords, duration, sportName, notes){
        super(coords, duration, notes)
        this.sportName = sportName;
        this.emoji = this._getEmoji(this.type)
    }

}


const app = new App;


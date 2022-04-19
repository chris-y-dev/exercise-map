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
const instructionsButton = document.getElementById('instructionsBtn')
let exercisePanelCloseButton;

const modal = document.getElementById('modal')
//Create App class

///////////////App logic - Code Architecture
//Activity Class
class App {
    //public field
    map;
    mapEvent;
    exercises = [];
    markers = [];
    data;
    markerData;
    exercisePanelCloseButton;

    //mandatory constructor - These will be set immediately upon app load
    constructor(){
        this._getPosition();
    
         //load introductory modal
         window.addEventListener('load', function(){
            modal.style.display = "block"
        })

        //close modal when click
        window.addEventListener('click', function(){
            modal.style.display = "none"
        })
        //Open modal for instructions
        instructionsButton.addEventListener('click', function(){
            console.log('click');
            location.reload();
        })
    
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
        this._retrieveMarkersLocalStorage();
        this._recreateExerciseObjs();

        //getclosestBtnElement
        sidebarContainer.addEventListener('click', this._getCloseBtnDOMElement.bind(this))
            
        console.log(`Exercises array: ${this.exercises}`);
        console.log(`Markers array:  ${this.markers}`);
    }

    //methods
   

    _getCloseBtnDOMElement(){
        if (!document.getElementById('exercise-panel-close-btn')) return;

        exercisePanelCloseButton = document.getElementById('exercise-panel-close-btn')
        // console.log('DOM get created for closebtn');
        // console.log(exercisePanelCloseButton);
       
        this._createCloseBtnEventListener();

    }

    _createCloseBtnEventListener(){
        

        if (!exercisePanelCloseButton) return;

        //Event listener + Identify ID 
        exercisePanelCloseButton.addEventListener('click', this._deleteExercisePanel.bind(this))
    }

    _deleteExercisePanel(e){
        let deleteItemID;

        if (!(e.target.closest('.exercisePanel').getAttribute('data-id'))) return;
        
       //retrieve data-ID (attribute)
       deleteItemID = e.target.closest('.exercisePanel').getAttribute('data-id')
       console.log(deleteItemID);

        //found Item
        const [foundObj] = this.exercises.filter(exercise=> exercise.id === deleteItemID)

        if (!foundObj) return;

        const {lat, lng} = foundObj.coords

        ////Delete marker + update marker array
        const newMarkersArray = [];
        let selectedMarker;

        console.log(this.markers);
        this.markers.forEach(function(marker){
            console.log(marker.id);
            if (marker.id === deleteItemID){
                selectedMarker = marker
               
                console.log(`${marker.id} deleted`);///////
            } else {
                newMarkersArray.push(marker)
            }
        })

        this.map.removeLayer(selectedMarker)

        
        if (newMarkersArray.length===0){
            localStorage.removeItem('markers')
        } else {
            this.markers = newMarkersArray;
            console.log(this.markers);///////
            this._saveMarkersToLocalStorage();
        }

       //Filter and delete Array
        const filteredArray = this.exercises.filter(exercise=> exercise.id != deleteItemID)
        console.log(filteredArray);

        //update localStorage Array
        if (filteredArray === []) {
            localStorage.removeItem('exercises')
        } else{
            this.exercises = filteredArray;
            this._saveLocalStorage();
        }

        //Turn display to none
        e.target.closest('.exercisePanel').classList.add('hidden')
    }


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
        
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
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


        this._createPopupDescription.bind(this)
        //////////Add marker
        this._renderMarker([exercise]);

        //clear form
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
        inputDistance.focus();
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
            <button type="button" id="exercise-panel-close-btn">&times;</button>
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
            <div class="exercisePanel exercise-panel-${exercise.type}" data-id="${exercise.id}">
            <h2>${exercise.emoji} ${this._capitaliseWord(exercise.sportName)}</h2>
                <button type="button" id="exercise-panel-close-btn">&times;</button>
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
        this._getCloseBtnDOMElement()
        this._createCloseBtnEventListener();
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
        if (!(e.target.closest('.exercisePanel'))) return;
        const exercisePanel = e.target.closest('.exercisePanel')
        //retrieve ID of element using HTML attribute assigned
        const panelId = exercisePanel.getAttribute('data-id');

        //serach in array for matching ID
        const foundExerciseObj = this.exercises.find(exercise => exercise.id === panelId)
        console.log(foundExerciseObj);

        if(foundExerciseObj===undefined)return; ////prevents bugs when panel removed

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
        console.log('exercises saved');
        console.log(localStorage.getItem('exercises'));
    }

    _saveMarkersToLocalStorage(){
        localStorage.setItem('markers', this.markers)
        console.log('markers saved');
        console.log(localStorage.getItem('markers'));
    }

    _retrieveLocalStorage(){
        if (!(localStorage.getItem('exercises'))) return;
        console.log(this.data);
        this.data = JSON.parse(localStorage.getItem('exercises'));
    }

    _retrieveMarkersLocalStorage(){
        // if (!(localStorage.getItem('markers'))) return;

        this.markerData = localStorage.getItem('markers');
        console.log(this.markerData);
    }

    _recreateExerciseObjs(){
        let exerciseObj
        const dataObjArray = [];

        if(!this.data) return;

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

        this._renderMarker(this.exercises);

        this._getCloseBtnDOMElement()
        this._createCloseBtnEventListener.bind(this)
    }

    _renderMarker(exercisesArray){
        //testing
        console.log(this.exercises);
        console.log(this.map);
        
        exercisesArray.forEach(exercise => {
            const {lat} = exercise.coords;
            const {lng} = exercise.coords;
            this._renderExercisePanel(exercise);


            const myMarker = L.marker([lat,lng], {draggable: false})

            myMarker.id = exercise.id;
    
            myMarker.bindPopup(
                L.popup({
                maxWidth: 350,
                className: `popup--${exercise.type}`
                }))
    
            myMarker.setPopupContent(this._createPopupDescription(exercise))
    
            this.map.addLayer(myMarker);
            this.markers.push(myMarker)
            console.log(myMarker);
            console.log(this.markers);
            myMarker.openPopup();
            })
            this._saveMarkersToLocalStorage();

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


//////////Old marker creation
 // L.marker([lat,lng]).addTo(this.map)
    // .bindPopup(
    //     L.popup({
    //         maxWidth: 350,
    //         className: `popup--${exercise.type}`
    //     }).setLatLng([lat,lng])
    //     )
    //     .setPopupContent(this._createPopupDescription(exercise))  


//////////Old marker creation 2
        // const {lat} = this.mapEvent.latlng;
        // const {lng} = this.mapEvent.latlng;
        // console.log(lat, lng);
        
        // const myMarker = L.marker([lat,lng], {draggable: false})

        // myMarker.id = exercise.id;

        // myMarker.bindPopup(
        //     L.popup({
        //     maxWidth: 350,
        //     className: `popup--${type}`
        //     }))

        // myMarker.setPopupContent(this._createPopupDescription(exercise))

        // this.map.addLayer(myMarker);
        // this.markers.push(myMarker)
        // console.log(myMarker);
        // myMarker.openPopup();
  

        // //Reset + close form
        // this._clearFormFields();
        // form.classList.add('hidden');

        // this._renderExercisePanel(exercise);

        // this._getCloseBtnDOMElement();
        // this._createCloseBtnEventListener.bind(this)
        // this._createCloseBtnEventListener();

////////Re-render marker
    // this.exercises.forEach(exercise => {
    //     const {lat} = exercise.coords;
    //     const {lng} = exercise.coords;
    //     this._renderExercisePanel(exercise);


    //     const myMarker = L.marker([lat,lng], {draggable: false})

    //     myMarker.id = exercise.id;

    //     myMarker.bindPopup(
    //         L.popup({
    //         maxWidth: 350,
    //         className: `popup--${exercise.type}`
    //         }))

    //     myMarker.setPopupContent(this._createPopupDescription(exercise))

    //     this.map.addLayer(myMarker);
    //     this.markers.push(myMarker)
    //     console.log(myMarker);
    //     myMarker.openPopup();
    //     })

///
document.addEventListener("DOMContentLoaded", function(e){
    //function to change gif below clock automatic
    changeGif();
    // to shpw clock
    displayClock(); 
    //to fetch recent search from local storage
    addToDropDown();

    
});

// open weather key and url
const myApikey = '9379af6198dd395a74a1fa52238c6538';
const baseUrl = 'https://api.openweathermap.org/data/2.5/onecall';

//--------- to fetch weather by city name------------------------------
async function fetchByCity(city){

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${myApikey}&units=metric`;

    try{
        //waiting for response
        const serverResponse = await fetch(url);

        //if not ok throwing error
        if(!serverResponse.ok){
            throw new Error('Server not responding');
        }

        //else converting to json format
        const cityData = await serverResponse.json();
        return cityData;
    
    //handling error    
    }catch(error){
        console.error('Something went wrong', error);
        return null;
    }
}

//----------to fetch multiple days forecast using cityNAme--------------------
async function fetchExtendedWeatherByCity(cityName){
    
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${myApikey}&units=metric`;


    try{
        //waiting for data
        const response = await fetch(url);

        //if not ok throwing error
        if(!response.ok){
            throw new Error('Server not responding properly');
        }

        //else converting to json format
        const FiveDaysData = await response.json();
        console.log('5 days',   FiveDaysData);
        
        //blank array to store 5 days data
        const dailyDataArray = {};
        let today = new Date();
        today = today.toLocaleDateString().split('T')[0];
        
 
        //iterating over response array to get 1 record of weather on each date
        FiveDaysData.list.forEach(data=>{
            const date = new Date(data.dt*1000).toLocaleDateString().split('T')[0];

            //adding if its new date forecast not alredy in array
            if (date !== today  && !dailyDataArray[date]) {
                dailyDataArray[date] = data;
              }
        });
        
        const filteredRecords = Object.values(dailyDataArray);
        
        console.log('flitered = ', filteredRecords);
        
        //returning only 5 days data with 1 record on each day
        return filteredRecords;

    }catch(error){
        //if error showing red dialog in bottom
        showMessage(error.message, 'red');
        console.error('Something went wrong', error);
        return null;
    }
}

//----------------to fetch weather using current location----------------------
async function fetchByLocation(latitude,longitude){
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${myApikey}`;
    
    try{
        //waiting for resp
        const serverResponse = await fetch(url);

        if(!serverResponse.ok){
            console.log('location resp', serverResponse);
            throw new Error('network error');
        }

        //converting to json
        const locationData = await serverResponse.json();
        return locationData;

    }catch(error){
        //if error showing dialog in bottom
        showMessage(error.message, 'red');
        console.error('Could not fetch by location', error);
        return null;
    }
}
//====================Event listner location button===================================
document.getElementById('location-btn').addEventListener('click', function(){
    
    // taking error span tag from html and clearing its content
    const msg = document.getElementById('error-span');
    msg.style.display = 'none';

    //checking if api suported or not
    if(navigator.geolocation){
        console.log('supported');

        navigator.geolocation.getCurrentPosition( async function(position){
               
            try{
                //destructuring the data
                const {latitude,longitude} = position.coords;
                console.log(latitude);
                console.log(longitude)
                
                //waiting for response
                const positionResponse = await fetchByLocation(latitude,longitude);
                
                //if response came properly
                if(positionResponse){
                    
                    //clearing old forecast data on html
                    document.getElementById('weather-div').style.backgroundImage = 'none'
                    
                    //shpwing dialog in bottom
                    showMessage('Fetching your Current Location.', '#008000	');
                    //displaying current date weather based on location
                    displayCurrentWeather(positionResponse);
                    
                    //from response taking city name and fetching multiple days forecast
                    const extendedWeatherByLocation = await fetchExtendedWeatherByCity(positionResponse.name);

                    if(extendedWeatherByLocation){
                        //diaplying 5 weather cards from response
                        displayWeatherCards(extendedWeatherByLocation);
                        //saving the search into local storage
                        addTolocalStorage(positionResponse.name);
                        // also fetching simultaneously
                        addToDropDown();
                    }
                }
            }catch(error){
                //dialog box something wrong
                showMessage(error.message, 'red');
                console.error('unable to fetch by location', error);
            }
        //extra handling of error if occured    
        }, function(error){

            console.error('error in fetching location', error);
        } );
    
    }
    //
    else{
        // if api not supported
        alert('Geolocation not working');
    }

})

//====================Event listner Search button=======================================

document.getElementById('search-btn').addEventListener('click', async function(){
    
    //taking cityname entered by user and removing whitespaces
    const cityName = document.getElementById('city-name').value.trim();
    //capturing error message span tag below input feild
    const msg = document.getElementById('error-span');


    // if any city entred
    if(cityName){

        ///fetching todays weather
        const currData = await fetchByCity(cityName);
        //fetching 5 days weather
        const extendedData = await fetchExtendedWeatherByCity(cityName);
        
        console.log("5days", extendedData);
        //if both fetched propely
        if(currData && extendedData){

            // removing a backgorund image i have kept in html
            document.getElementById('weather-div').style.backgroundImage = 'none'
            //removing any previous error message
            msg.style.display = 'none';
            
            //displaying todays weather
            displayCurrentWeather(currData);
            //displaying 5 days weather
            displayWeatherCards(extendedData);
            //adding search city to local storage
            addTolocalStorage(cityName);
            //fetching simultaneously after adding and showing in dropdown
            addToDropDown();
            
            //also making the dropdwon visible 
            document.getElementById('recent-city').classList.remove('hidden');

        }else{
            //if user enters invalid city
            showMessage(`Invalid location No data for ${cityName}` , 'red');
        }
        
    }else{
        //if user tries to search empty input showing error in span and dialog both
        msg.innerHTML = 'Please enter a city';
        msg.className = 'text-sm text-red-600 bg-amber-100 p-1'
        showMessage('City name Cannot be Empty', 'red');
    }

})
//===============Event listner when city selected from dropdown==============================

document.getElementById('recent-city').addEventListener('change', async (event)=>{
    
    //clearing previous errors
    const msg = document.getElementById('error-span');
    msg.style.display = 'none';
    
    //capturing city selected from dropdown
    const cityName = event.target.value;
    
    if(cityName != null){
        
        //fetching todays weather
        const result = await fetchByCity(cityName);
        //fetching 5 days weather
        const fiveData = await fetchExtendedWeatherByCity(cityName);
        
        //if both fetched properly
        if(result && fiveData){
            
            // removing a backgorund image i have kept in html
            document.getElementById('weather-div').style.backgroundImage = 'none'
            
            //showing todays weather
            displayCurrentWeather(result);
            //showing 5 days weather in cards
            displayWeatherCards(fiveData);
        }
    }
})

//--------------------This displays todays weather on Top right side--------------------------------------------
function displayCurrentWeather(data){
    // parent div to show todasy weather
    const parentDiv = document.querySelector('#weather-div');

    parentDiv.innerHTML = '';

    //creating card div
    const card = document.createElement('div');
    card.className = 'bg-blue-500 w-1/2 flex flex-col items-start justify-center p-5 rounded-md glass';
    
    //adding cityname
    const cityName = document.createElement('h1');
    cityName.innerHTML = data.name;
    cityName.className = 'text-md md:text-xl text-white font-bold mb-1';
    
    //adding date
    const date = document.createElement('span');
    date.innerHTML = '[ ' + showDate() + ' ]';
    date.className = 'font-black bg-white text-sm md:text-sm lg:text-lg rounded-md lg:p-1  mb-2';
    
    //adding temperature------
    const temperature = document.createElement('p');
    temperature.innerHTML = 'Temperature: ';
    temperature.className = 'text-sm md:text-lg text-white font-mono mb-2';
    const spanTemp = document.createElement('span');
    //inside temperature adding child element
    spanTemp.innerHTML = data.main.temp + '°C';
    spanTemp.className = 'text-sm md:text-md lg:text-lg  bg-blue-400 p-1 rounded-md';
    temperature.appendChild(spanTemp);
    
    //adding humidity---------
    const humidity = document.createElement('p');
    humidity.innerHTML = 'Humidity: ';
    humidity.className = 'text-sm md:text-lg text-white font-mono mb-2';
    //inside hunidity adding child element
    const spanHumid = document.createElement('span');
    spanHumid.innerHTML = data.main.humidity + '%';
    spanHumid.className = 'text-sm md:text-md lg:text-lg  bg-blue-400 p-1 rounded-md';
    humidity.appendChild(spanHumid);
    
    //adding wind-----------
    const wind = document.createElement('p');
    wind.innerHTML = 'Wind Speed: ';
    wind.className = 'text-sm md:text-lg text-white font-mono';
    //inside wind adding child element
    const spanWind = document.createElement('span');
    spanWind.innerHTML = data.wind.speed + 'Km/h';
    spanWind.className = 'text-sm md:text-md lg:text-lg  bg-blue-400 p-1 rounded-md';
    wind.appendChild(spanWind);
    
    //appending all text elements to card div
    card.appendChild(cityName);
    card.appendChild(date);
    card.appendChild(temperature);
    card.appendChild(humidity);
    card.appendChild(wind);
    
    //------additionally on right top side adding image of todays weather
    const iconDiv = document.createElement('div');
    iconDiv.className = 'flex flex-col justify-center items-center w-1/2'
    
    const weatherImg = document.createElement('img');
    const iconCode = data.weather[0].icon;
    //taking correct img from response use icon code and adding on right side
    weatherImg.src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherImg.alt = data.weather[0].description;
    weatherImg.className = 'weather-img w-30 h-30 mb-8 rounded-full';
    weatherImg.style.filter= 'drop-shadow(0 0 0.75rem orange'
      
    //adding temperature again below todays weather image on right side
    const weatherTemp = document.createElement('h1');
    weatherTemp.innerHTML = data.main.temp + ' °C';
    weatherTemp.className = 'text-2xl font-bold text-gray-600';

    //information about todays weather
    const weatherInfo = document.createElement('h2');
    weatherInfo.innerHTML = data.weather[0].description;
    weatherInfo.className = 'text-lg';
    weatherInfo.style.fontFamily = 'Arial, Helvetica, sans-serif';
    
    //appending images, temp, info to  icon div
    iconDiv.appendChild(weatherImg);
    iconDiv.appendChild(weatherTemp);
    iconDiv.appendChild(weatherInfo);
    
    //finally todays weather blue card is added to parent
    parentDiv.appendChild(card);
    //also weather image is added to parent
    parentDiv.appendChild(iconDiv)
    
}

//-----------------This Displays 5 weather forecast cards on right side----------------

function displayWeatherCards(FiveDaysData){
    
    //taking parent container and clearing old data
    const parentDiv = document.getElementById('forecast-div');
    parentDiv.innerHTML = '';
    
    //from array of data recieved from api doing something
    FiveDaysData.forEach(day => {
    
    //creating card div
    const card = document.createElement('div');
    card.className = 'flip text-black rounded-lg shadow-md p-2 flex flex-col gap-4 justify-between';
    
    //adding date of string value
    const date = new Date(day.dt * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const dateEl = document.createElement('h3');
    dateEl.innerHTML = date;

    dateEl.className = 'text-md font-mono mb-2 text-center';
    dateEl.style.fontWeight = 'bold'
    
    //taking proper icon based on icon code from response
    const iconCode = day.weather[0].icon;
    const weatherImg = document.createElement('img');
    weatherImg.src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
    // weatherImg.alt = data.weather[0].description;
    weatherImg.className = 'w-24 h-24 mx-auto';
    weatherImg.style.filter = 'drop-shadow(0 0 0.75rem rgb(160, 0, 210))'
    
    //adding weather info also
    const info = document.createElement('h2');
    info.innerHTML = day.weather[0].description;
    info.className = 'text-sm  text-center';
    info.style.fontFamily = 'Nunito, sans-serif';
    info.style.fontWeight = 'bold'
    
    //adding temperature
    const temperature = document.createElement('h3');
    temperature.innerHTML = `Temp: ${day.main.temp} °C`;
    temperature.className = 'text-white font-mono mb-2 text-sm text-left  bg-amber-600 rounded-full p-2 md:p-3';
    
    //adding wind
    const wind = document.createElement('h3');
    wind.innerHTML = 'Wind Speed: ' +  day.wind.speed + ' km/h';
    wind.className = 'text-white font-mono mb-2 text-sm text-left  bg-amber-600 rounded-full p-2 md:p-3 ';
    
    //adding humidity
    const humidity = document.createElement('h3');
    humidity.innerHTML = `Wind: ${day.main.humidity} km/h`;
    humidity.className = 'text-white font-mono text-sm text-left  bg-amber-600 rounded-full p-2 md:p-3 ';
    
    //adding all tags to parent card
    card.appendChild(dateEl);
    card.appendChild(weatherImg);
    card.appendChild(info);
    card.appendChild(temperature);
    card.appendChild(wind);
    card.appendChild(humidity);
    
    //adding card to parent container
    parentDiv.appendChild(card);
    });
}

//--------------------to covert date into string representation---------------------------
function convert(date){
    const dateObj = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
    return date.toLocaleDateString(undefined, dateObj);
}
function showDate(){
    const date = new Date();
    return convert(date);
}

//---------------------This saves recent searched city to local storage------------------------------
function addTolocalStorage(cityName){
    
    //taking array from local storage
    const cityArray = JSON.parse(localStorage.getItem('cities')) || [];

    //if new city adding to local storage
    if(!cityArray.includes(cityName)){
        cityArray.push(cityName);
        
        //if  search more than 4 city the oldest city will be removed using shift()
        if(cityArray.length > 4){
            cityArray.shift();
        }
        //setting the item back to storage
        localStorage.setItem('cities', JSON.stringify(cityArray) );
    } 
}

//----------------------This Fetch recenty cities from local storage---------------------------------
function addToDropDown(){

    //taking array from storage
    const cityArray = JSON.parse(localStorage.getItem('cities')) || [];
    //taking dropdown also
    const dropDown  = document.getElementById('recent-city');
    
    dropDown.innerHTML = '';
    
    //to show a default value in dropdown
    const defaultValue = document.createElement('option');
    defaultValue.value = '';
    defaultValue.selected = true;
    defaultValue.disabled = true;
    defaultValue.innerHTML = 'recently searched ';
    
    dropDown.appendChild(defaultValue);
    
    //if there are any city in local storage
    if(cityArray.length > 0){
        
        //fetching city and adding to dropdown
        cityArray.forEach((city)=>{
            const choices = document.createElement('option');
            choices.value = city;
            choices.innerHTML = city;
            dropDown.appendChild(choices);
        })
    }else{
        //if no city searched dropdown is hidden intially
        dropDown.classList.add('hidden');
    }

}

//-----------------------This is for displaying black digital clock-----------------------------------------

function displayClock(){
    setInterval(function(){
        let date = new Date();
        let hours = date.getHours();
        let mins = date.getMinutes();
        let seconds = date.getSeconds();
        
        // to make numbers 2 digit in clock
        mins = mins < 10 ? '0'+mins: mins;
        seconds = seconds < 10 ? '0'+seconds: seconds;

        document.getElementById('hr').textContent = hours + ' :';
        document.getElementById('min').textContent = mins + ' :';
        document.getElementById('sec').textContent = seconds;
        
    },1000)
}
//-------------------------------To show colred dialog box on error or successful operation----------------------------------------

function showMessage(msg ,color){

    const div = document.createElement('div');
    div.textContent = msg;
    div.style.padding = '10px';
    div.style.backgroundColor = color;
    div.style.border = '1px solid black';
    div.style.position = 'absolute';
    div.style.bottom = '25px';
    div.style.color = 'white';
    div.style.left = '50%';  
    div.style.transform = 'translateX(-50%)';
    div.style.borderRadius = '15px';
    div.style.fontFamily = 'monospace';
    div.style.fontWeight = 'bold';
    div.style.fontSize = '15px';

    const button = document.createElement('button');
    button.style.backgroundColor = 'white'
    button.style.color = 'black';
    button.style.padding = '5px';
    button.style.marginLeft = '10px';
    button.style.borderRadius = '50%';
    button.style.border = '1px solid black';
    
    button.textContent = "OK";
   
    button.addEventListener('click', function(){
        div.remove();
    })

    div.appendChild(button);
    document.body.appendChild(div);

    // to remove dialog box after 5 sec
    setTimeout(function() {
        div.remove();
    }, 5000);
}

//--------Function to alteratively change current gif displayed below clock on left--------------
function changeGif(){
    //intially first image
    let index = 0;
    //taking all images as nodeList
    const allImages = document.querySelectorAll('img[alt="weather-gif"]');
    
    setInterval(()=>{
        //toggle visblity after 6 seconds and increase index by 1
        allImages[index].classList.toggle('visible');
        allImages[index].classList.toggle('hidden');

        index = (index + 1) % allImages.length;
        
        allImages[index].classList.toggle('visible');
        allImages[index].classList.toggle('hidden');

    },6000)
}

//----------------------------------------------------END--------------------------------------------------
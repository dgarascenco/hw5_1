const http = require("http")
const {HOST,PATH,KEY, PATH_GENRE} = require('./config')

const readline = require('readline');
const { getEnabledCategories } = require("trace_events");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  console.clear()
let query="";
let genres="";
let year=0;
let sort_by="popularity.desc";

////////////////////////  Запрос для создание массива жанров
const callbackGenres = (res) => {   res.on('data', (chunk) => {    genres =  JSON.parse(chunk.toString()).genres   }); }
const req = http.request( {
    host: HOST,
    path: PATH_GENRE + `?api_key=${KEY}`,
    port: 80,
    method: "GET"   
}, callbackGenres);
req.end();
function showGenres(genres_id) {   
    genres_id.forEach( genre_id => {
        for( let i=0; i < genres.length; i++)
            if ( genres[i].id == parseInt(genre_id) )
                console.log(" " + genres[i].name);
    });

}

const callback = ( res ) => {
    console.clear();
    let data="";
    res.on('data', (chunk) => { 
        data += chunk.toString(); 
    })  

    res.on('end', () => { 

        data = JSON.parse( data.toString() );

        function showResults(){
            console.log(`System founded ${data.total_results} films. Page ${data.page} of ${data.total_pages}`) ; 
            let i=0;   
            data.results.forEach(film => console.log(i++, film.title));

            rl.question(`Choose the film or change page ( 'page' + SPACE + <number of page> ) >>>  `, (option)=>{
                console.clear();
                //////////////////////   Если выбрана цифра  - выбор просмотра фильма из текущей страницы
                if (/^\d+$/.test(option) && parseInt(option) >=0 && parseInt(option) < 20 ){
                    console.log(`Title: ${data.results[option].title}`);
                    console.log("Genres:");
                    showGenres(data.results[option].genre_ids) ;               
                    console.log(`\nOverview: ${data.results[option].overview}`);
                    console.log(`\nRating: ${data.results[option].popularity}`);
                    console.log(`\nYear: ${data.results[option].release_date}`);
                    rl.question(`\nEnter any key to back to main menu...  `, (option)=>{ 
                        console.clear();
                        showResults();
                    });
                } 
                //////////////////////Если введена строка в виде 'page <№страницы>'                  
                else if( option.split(" ")[0] == "page" && option.split(" ").length == 2 && /^\d+$/.test(option.split(" ")[1]) ){    
                    showPage(option.split(" ")[1]);
                }
                //////////////если введено 'exit' для выхода
                else if( option == "exit" ){
                    mainMenu();
                }
                /////////////если введено  остальное
                else{
                    console.clear();
                    showResults();
                    console.log(" Error choice, try again. Choose >>>");
                }  
            })
        }
        showResults();
    })
    res.on('error', () => { console.log("API response ERROR") })
}

///////////// основное меню
function mainMenu(){  

    rl.question(`Choose option for search movie.
                Press 1 to change year: ${year}
                Press 2 to change sort type (by default - popularity.desc): ${sort_by}
                Press 'exit' to exit system
                Press the word to search the movie >>`, (option)=>{

        if (option == "exit")   
            process.exit();
        if (/^\d+$/.test(option)){    ////////////  если строка состоит из цифр (подразумевается ввод числа)
            if (parseInt(option) == 1)   /////      если введено 1
                changeYear();
            if (parseInt(option) == 2)  ///////если введено 2
                changeSortType();
        }
        else {            
            query = option;
            const req = http.request( {
                host: HOST,
                path: PATH + `?query=${option}&year=${year}&api_key=${KEY}&sort_by=${sort_by}`,
                port: 80,
                method: "GET"   
            }, callback)
            req.end()
            setTimeout(mainMenu, 500);
        }
    });
}

////////////// Функция вывода результата конкретной странички
function showPage(page){
        if (page == "exit")   
            process.exit()

        const req = http.request( {
            host: HOST,
            path: PATH + `?query=${query}&year=${year}&api_key=${KEY}&sort_by=${sort_by}&page=${page}`,
            port: 80,
            method: "GET"   
        }, callback)

        req.end()    
}
////////////// Функция изменения года фильма
function changeYear(){
    console.clear()
    rl.question(`Choose the year of film (enter 'exit' to back) >>`, (option)=>{
        if (option == "exit")
            mainMenu();
        else if ( /^\d+$/.test(option) && option.length == 4 ){ ////////////  если введен год (число из 4-х цифр)
            year = parseInt(option);
            mainMenu();
        }
        else {
            console.clear()
            console.log("Sorry, you entered invalid year, please try again"); 
            setTimeout(changeYear, 1000);              
        }        
    });
}
////////////// Функция изменения типа сортировки по популярности фильма
function changeSortType(){
    console.clear()
    rl.question(`Choose the type of sort (enter 'exit' to back):
    1 - popularity desc (by default)
    2 - popularity asc >>`, (option)=>{
        if (option == "exit")
            mainMenu();
        else if ( (/^\d+$/.test(option) && option.length == 1) && (parseInt(option) == 1 || parseInt(option) == 2)){  ////////////  если введено число из 1-й цифры
            if (parseInt(option) == 1 )
                sort_by = "popularity.desc";
            if (parseInt(option) == 2 )
                sort_by = "popularity.asc";
            mainMenu();
        }
        else {
            console.clear()
            console.log("Sorry, you entered invalid sort type, please try again ");
            
            setTimeout(changeSortType, 1000);          
        }        
    });
}
mainMenu();

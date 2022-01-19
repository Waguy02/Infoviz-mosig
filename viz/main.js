
///Declarations
//1. D3 components
var d3;
var svg;

//2. World map builder
var width;
var height;
var world;
var projection;
var path;d3.geoPath().projection(projection);

//3. Data
var dataset=[];
var countries={};
const YEARS=[2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2018,2019,2020]
var INDICATOR_NAMES=[]
const SUBINDICATOR_INDEX="Index",
    SUBDINDICATOR_RANK="Rank"

//4. Scaling ;
const RADIUS_FACTOR=10;
const RADIUS_MIN=5;


//5. Configuration;
var config={
    year:2006,
    indicator:undefined,
    rank_mode:true,
    aggregate_continents:false,
}


//6. Color

var CONTINENTS_COLOUR={
    Africa:"yellow",
    Europe:"red",
    "North America":"orange",
    "South America":"purple",
    Asia :"green",
    Oceania:"pink"


}



//Functions

//1. Dataset Setup
async function setup_dataset(){

    world=await d3.json("../data/world_map.json");
        projection = d3.geoMercator().scale(200).translate([width / 2, height / 2]).precision(.1);
        path = d3.geoPath().projection(projection);

        async function load_countries_positions(){
            //Draw map
            svg.append("path")
                .datum(topojson.feature(world, world.objects.countries))
                .attr("d", path)
                .attr("class", "land-boundary");




            //Now loading countries positions;
            let features=topojson.feature(world, world.objects.countries).features;
            for(let d of features){
                let country={
                    name: d["id"],
                    center:path.centroid(d),
                    radius:Math.sqrt(path.area(d) / Math.PI)
                    }

                countries[country.name]=country;
                };
            }
        await load_countries_positions();

        async function load_continent_positions(){
            await d3.csv("../data/continents.csv", d =>  {
                let continent=d["Continent"];
                let country=d["Country"];
                if(!countries[country]){
                    //continent not founnd
                    return;
                }
                countries[country]["continent"]=continent;

            }).
            then(data=> {

            });
        }
        await  load_continent_positions();


        await d3.csv("../data/data.csv", d =>  {
                let country_data={
                country_iso:d["Country ISO3"],
                country_name:d["Country Name"],
                indicator_id:d["Indicator Id"],
                indicator_name:d["Indicator"],
                subindicator_type:d["Subindicator Type"],
                years_data:{}
                    }   ;

                if(!countries[country_data.country_name]){
                //Position not found
                return;
                }
                for (var year of YEARS)country_data.years_data[year.toString()]=parseFloat(d[year.toString()]);
                country_data["center"]=countries[country_data.country_name].center;
                country_data["radius"]=countries[country_data.country_name].radius;
                country_data["continent"]=countries[country_data.country_name].continent;
                dataset.push(country_data);
                }).
        then(data=> {
            INDICATOR_NAMES=[...new Set(dataset.map(d=>d.indicator_name))].slice(0,19);
            //The slice is performed because the dataset is dirty: there are shifts

        });




    }




/***2
 * Render countries data individually
 * @param indicator_name
 * @param year
 * @returns {Promise<void>}
 */
async function render(config)
{


    const indicator_name=config.indicator, year=config.year,rank_mode=config.rank_mode,aggregate_continents=config.aggregate_continents;
    d3.selectAll("circle").remove(); //Remove all existing points;



    let filtered_values=dataset.filter((d) => d.indicator_name==indicator_name&&!isNaN(d.years_data[year])
        &&d.subindicator_type==SUBINDICATOR_INDEX);

    let ranks=dataset.filter((d) => d.indicator_name==indicator_name&&!isNaN(d.years_data[year])
        &&d.subindicator_type==SUBDINDICATOR_RANK).map(d=>d.years_data[year])

    if(rank_mode){
        let colour_scale=generateColourRange(filtered_values.length);
        for (let i =0;i<filtered_values.length;i++){
            let rank=ranks[i];
            filtered_values[i]["rank"]=rank;
            filtered_values[i]["colour"]=colour_scale[rank-1];
            }
    }
    else{
        for (let i =0;i<filtered_values.length;i++){
            filtered_values[i]["colour"]=CONTINENTS_COLOUR[filtered_values[i].continent];
        }
    }




    const scaler=scaler_generator(filtered_values,year);




    svg.selectAll('circle').data(
        filtered_values
        )
        .enter().append("circle")
        .on("mouseover", function(event,d) {
            d3.select("#info").style('opacity',1).style('top',d.center[1].toString()+"px").style('left',d.center[0].toString()+"px")
            d3.select("#country").html(d.country_name);
            d3.select("#year").html(year)
            d3.select("#value").html(d.years_data[year].toFixed(2))

        })
        .on("mouseout", function(event,d) {
            d3.select("#info").style('top',"-100000px").style('left',"-100000px")


        })
        .style("fill",function(d) {
            return d.colour;
        })
        .attr("r", function(d) {
            return scaler(d);
        }).
        attr('transform', function (d) {
        return 'translate(' + d.center + ')'});


}





/**
 *
 */
function scaler_generator(filtered_values,year) {
    let values=filtered_values.map(d=>d.years_data[year])
    let max=Math.max(...values);
    let min=Math.min(...values);
    return function(x){
        let x_scale=(x.years_data[year]-min)/(max-min);
        ;

        return RADIUS_MIN+x_scale*RADIUS_FACTOR;
    }
}



function build_menu(config){
    d3.select("#year_selector").attr("min",YEARS[0]).attr("max",YEARS[YEARS.length-1]).attr("value",config.year);
    d3.select("#current_year").html(config.year.toString());

    const check_aggregation=document.getElementById("aggregation_check");
    check_aggregation.addEventListener(
        'change', (e) => {
            config.rank_mode=!config.rank_mode;
            render(config);

        });


    const selector=document.getElementById("indicator_selector");
    INDICATOR_NAMES.forEach((c)=>{
        var opt = document.createElement('option');
        opt.value = c;
        opt.innerHTML = c;
        selector.appendChild(opt);
    })
    selector.selectedIndex=0;

    selector.addEventListener('change', (e) => {
        config.indicator=e.target.value;
        render(config);

    });

    document.getElementById("year_selector").addEventListener(
        'change', (e) => {
            console.log("Rendering");
            config.year=e.target.value;
            d3.select("#current_year").html(config.year.toString());
            render(config);

        });


}


function generateColourRange(numberOfColours){

    function getRGBAValues(string) {

        var cleaned = string.substring(string.indexOf('(') +1, string.length-1);
        var split = cleaned.split(",");
        var intValues = [];
        for(var index in split){
            intValues.push(parseInt(split[index]));
        }
        return intValues;
    }
    function hexToRGBA(hex, alpha){
        var c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
        }

        //throw new Error('Bad Hex');
    }


    const toColour="#b80d0d";
    const fromColour="#2f6c04"

    if(numberOfColours==1){
        return [toColour];
    }
    var colours = []; //holds output
    var fromSplit = getRGBAValues(hexToRGBA(fromColour, 1.0)); //get raw values from hex
    var toSplit = getRGBAValues(hexToRGBA(toColour, 1.0));

    var fromRed = fromSplit[0]; //the red value as integer
    var fromGreen = fromSplit[1];
    var fromBlue = fromSplit[2];

    var toRed = toSplit[0];
    var toGreen = toSplit[1];
    var toBlue = toSplit[2];

    var difRed = toRed - fromRed; //difference between the two
    var difGreen = toGreen - fromGreen;
    var difBlue = toBlue - fromBlue;

    var incrementPercentage = 1 / (numberOfColours-1); //how much to increment percentage by

    for (var n = 0; n < numberOfColours; n++){

        var percentage = n * incrementPercentage; //calculate percentage
        var red = (difRed * percentage + fromRed).toFixed(0); //round em for legibility
        var green = (difGreen * percentage + fromGreen).toFixed(0);
        var blue = (difBlue * percentage + fromBlue).toFixed(0);
        var colour = 'rgba(' + red + ',' + green + ',' + blue + ',1)'; //create string literal
        colours.push(colour); //push home

    }

    return colours;
}

async function init(){
    width =document.getElementById("body").offsetWidth;
    height =document.getElementById("body").offsetHeight;
    svg = d3.select('#viz').append('svg').attr('width', width).attr('height', height);

    projection = d3.geoMercator().scale(200).translate([width / 2, height / 2]).precision(.1);
    path = d3.geoPath().projection(projection);

    await  setup_dataset() ;
    config.indicator=INDICATOR_NAMES[0];
    build_menu(config);
    await  render(config);
}

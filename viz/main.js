
///Declarations
//1. D3 components
var d3;
var svg;

//2. World map builder
const width = 1920, height = 1080   ;
var world;
var projection = d3.geoMercator().scale(200).translate([width / 2, height / 2]).precision(.1);
var path = d3.geoPath().projection(projection);

//3. Data
var dataset=[];
var countries={};
const YEARS=[2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2018,2019,2020]
var INDICATOR_NAMES=[]

//Functions

//1. Dataset Setup
async function setup_dataset(){

        world=await d3.json("../data/world_map.json");
        projection = d3.geoMercator().scale(200).translate([width / 2, height / 2]).precision(.1);
        path = d3.geoPath().projection(projection);

        async function load_countries_positions(){
            //Now loading countries positions;
            let features=topojson.feature(world, world.objects.countries).features;
            for(let d of features){
                country={
                    name: d["id"],
                    center:path.centroid(d),
                    radius:Math.sqrt(path.area(d) / Math.PI)
                    }

                countries[country.name]=country;
                };
            }
        await load_countries_positions();



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
                    country_data.id=country_data.indicator_id+country_data.indicator_id
                //Position not found
                return;
                }
                for (var year of YEARS)country_data.years_data[year.toString()]=parseFloat(d[year.toString()]);
                country_data["center"]=countries[country_data.country_name].center;
                country_data["radius"]=countries[country_data.country_name].radius;
                dataset.push(country_data);
                }).
        then(data=> {
            INDICATOR_NAMES=[...new Set(dataset.map(d=>d.indicator_name))]
            });



        }


/***
 * Render countries data individually
 * @param indicator_name
 * @param year
 * @returns {Promise<void>}
 */
async function render_countries_data(indicator_name,year)
{
    d3.select("g").remove(); //Remove all existing points;
    let scale_factor=scale(indicator_name);

    let filtered_values=dataset.filter((d) => d.indicator_name==indicator_name);

    svg.selectAll('circle').data(
        filtered_values
        )
        .enter().append("circle")
        .attr("r", function(d) {
            return d.years_data[year]*scale_factor;
        })
        .on('mouseover', d => d3.select('#info').text(d.country_name+"\n"+year+"\n"+indicator_name))
        .attr('transform', function (d) {
        return 'translate(' + d.center + ')'});


}


/***
 * Render continentns agregation data;
 * @param indicator_name
 * @param year
 * @returns {Promise<void>}
 */
async function render_continents(indicator_name,year){

}


/**
 *
 */
function scale(index) {
    return 0.2;
}




async function init(){
        svg = d3.select('#viz').append('svg').attr('width', width).attr('height', height);
        await  setup_dataset() ;
        await  render_countries_data("Estimated earned income (PPP, US$)",2018);
    }

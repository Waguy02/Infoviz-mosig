if (CB == null || typeof (CB) != "object") {
    var CB = new Object();
}

function drawAtlas() {
    //private var's and functions
    function draw(id, json) {
        document.getElementById('title').innerHTML = "World Map";

        var width = 960,
            height = 500;

        var projection = d3.geo.robinson()
            .scale(150)
            //.translate(100,100)
            .precision(.5);

        var path = d3.geo.path()
            .projection(projection);

        var svg = d3.select("#" + id)
            .attr("width", width)
            .attr("height", height)
            .attr("style", "background:" + json.bc);

        // grid
        var graticule = d3.geo.graticule()
            .extent([[-180, -90], [180 - .1, 90 - .1]]);

        svg.append("path")
            .datum(graticule)
            .attr("class", "graticule")
            .attr("d", path);

        //shape
        d3.json("https://dl.dropboxusercontent.com/s/2qg71ltlq0hc88j/readme-world-110m.json", function (error, world) {
            console.log(world);
            var countries = svg.selectAll(".countries")
                .data(topojson.feature(world, world.objects.countries).features)
                .enter()
                .append("path")
                .attr("style", "fill:#FEFEE4")
                .attr("class", "country")
                .attr("d", path)
                .attr("hi",function(d){
                    //console.log(d);
                })

                .on("mouseover", function(d){d3.select(this).style("fill", "red");})
                .on("mouseout", function(d){d3.select(this).style("fill", "white");});

            svg.selectAll(".dots")
                .data(topojson.feature(world, world.objects.countries).features)
                .enter()
                .append("circle")
                .attr("r","6")
                .attr("fill","black")
                .attr("transform",function(d){
                    var p = projection(d3.geo.centroid(d));
                    return "translate("+p+")";
                });

        });

    }

    window.CB.geo = {
        draw: draw
    };
};

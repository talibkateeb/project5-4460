yearSelected = "All";
genreSelected = "All Genres";
//Variables initialization
var attributesX = ['movieLikes', 'duration'];

var axisMapY = { 'movieLikes' : 'Movie Facebook Likes',
                 'duration' : 'Duration (min)'}

var colorOfTrellis = { 'movieLikes' : '#56d945',
                 'duration' : '#3379eb'}

var find = true;

var directorCurrent = "none";

var a1Current = "none";

var a2Current = "none";

var a3Current = "none";

var movieCurrent = "none";

var svg = d3.select('svg');

var widthSVG = +svg.attr('width');

var heightSVG = +svg.attr('height');

var widthChart = widthSVG - 200;

var heightChart = 420 - 50 - 40;

var widthTrellis = widthSVG/2.8;

var heightTrellis = heightSVG/4;

var domains = { 'imdb' : [0.0, 10.0] };

var bubbleChart = svg.append('g')
    .attr('class', 'bubblechart')
    .attr('transform', 'translate('+[80, 50]+')');

var trellis = svg.append('g')
    .attr('class', 'trellis')
    .attr('transform', 'translate('+[80, heightChart+80*1.85-15]+')');

var colorsLegend = ['#00ff00','#29e6ff','#ec973c','#ff0000','#b42695', '#232323'];

var wordsLegend = ['G', 'PG','PG-13', 'R', 'Unrated', 'Not Rated'];

var genres = [];

var scaleX = d3.scaleLinear()

var scaleY = d3.scaleLinear().range([heightChart,0]).domain(domains['imdb']);

var scaleR = d3.scaleSqrt().range([0,40]);

var scaleGross = d3.scaleLinear().range([heightTrellis, 0]);

d3.csv('./movies.csv',
    function(d){
        return {
            gross: +d.gross,
            budget: +d.budget,
            movieTitle: d.movie_title,
            year: +d.title_year,
            directorName: d.director_name,
            directFbLikes: d.director_facebook_likes,
            actor1: d.actor_1_name,
            actor2: d.actor_2_name,
            actor3: d.actor_3_name,
            a1Likes: d.actor_1_facebook_likes,
            a2Likes: d.actor_2_facebook_likes,
            a3Likes: d.actor_3_facebook_likes,
            castTotalLikes: +d.cast_total_facebook_likes,
            movieLikes: +d.movie_facebook_likes,
            genres: d.genres,
            imdbScore: +d.imdb_score,
            language: d.language,
            country: d.country,
            contentRating: d.content_rating,
            duration: +d.duration,
            color: d.color,
            numCritForReviews: +d.num_critic_for_reviews,
            numUserForReviews: +d.num_user_for_reviews,
            numVotedUsers: +d.num_voted_users,
            faceNumInPoster: +d.facenumber_in_poster,
            plotKeywords: d.plot_keywords,
            imdbLink: d.movie_imdb_link,
            aspectRatio: +d.aspect_ratio,
        }
    },
    // functions needed
    function(error, dataset){
        if(error) {
            console.error(error);
            return;
        }
        movies = dataset;
        extentGross = d3.extent(dataset, function(d){ return d.gross; });
        extentBudget = d3.extent(dataset, function(d) { return d.budget; });
        movieLikesMaximum = d3.max(dataset, function(d) {return d.movieLikes });
        durationMaximum = d3.max(dataset, function(d) { return d.duration; });
        extentMap = { 'movieLikes' : [0, movieLikesMaximum],
                      'duration' : [0, durationMaximum]}
        scaleGross.domain(extentGross);
        nestByMovieTitle = d3.nest()
            .key(function(d) { return d.movieTitle})
            .entries(dataset);
        bubbleChart.append('text')
            .attr('x', widthChart/2)
            .attr('y', heightChart + 30)
            .text('Total Budget');
        bubbleChart.append('text')
            .attr('x', -heightChart)
            .attr('y', -30)
            .attr('transform', 'rotate(270)')
            .text('IMDb Score');
        bubbleChart.append('text')
            .attr('x', -60)
            .attr('y', -15)
            .style('align', 'center');
        trellis.append('text')
            .attr('x', -60)
            .attr('y', -15)
            .attr("transform", "translate("+((widthSVG/3) + 100)+","+0+")")
            .text('Gross Relations');
        updateChart(yearSelected, genreSelected, '/');
        var set = new Set()
        movies.forEach(function(d) {
            var temp = d['genres'].split('|');
            temp.forEach(function(v) {
                set.add(v);
            })
        })
        var sortedArr = Array.from(set).sort();
        genreSelect = d3.select('#genreSelect');
        genreOptions = genreSelect.selectAll('option')
            .data(sortedArr)
            .enter()
            .append('option')
            .text(function (d) { return d; })
        makeTrellis(yearSelected, genreSelected, '/');
    });
// search function
function search(){
    var text = d3.select('#searchInput').node().value;
    updateChart(yearSelected, genreSelected, text);
    makeTrellis(yearSelected, genreSelected, text);
}
// function to clear search
function clearSearch() {
    d3.select('#searchInput').node().value = "";
    updateChart(yearSelected, genreSelected, '/');
    makeTrellis(yearSelected, genreSelected, '/');
}
// function for yeaar change
function onYearChanged() {
    var select = d3.select('#yearSelect').node();
    yearSelected = select.options[select.selectedIndex].value;
    updateChart(yearSelected,genreSelected, '/');
    makeTrellis(yearSelected, genreSelected, '/');
}
//function for genre change
function onGenreChanged() {
    var select = d3.select('#genreSelect').node();
    genreSelected = select.options[select.selectedIndex].value;
    updateChart(yearSelected, genreSelected, '/');
    makeTrellis(yearSelected, genreSelected, '/');
}
// function to update the chart
function updateChart(year, genre, text) {
    var filtered;

    if(text != '/') {
        filtered = movies.filter(function(d) {
            var title = d['movieTitle'].toLowerCase();
            return title.includes(text.toLowerCase());
        })
    } else {
        var yearsFiltered = movies.filter(function(d){
            if (year == "All") {return true;}
            return year == d.year;
        });

        var yearsGenresFiltered = yearsFiltered.filter(function(d){
            if (genre == "All Genres") {return true;}
            return d.genres.includes(genre);
        });
        filtered = yearsGenresFiltered;
    }

    var dot = svg.selectAll('.block')
        .classed('filtered', function(d) {
            if(text != '/') {
                var title = d['movieTitle'].toLowerCase();
                return title.includes(text.toLowerCase());
            } else {
                var yearFilter;
                var genreFilter;

                if(year == "All") {
                    yearFilter = true;
                } else {
                    yearFilter = year == d.year;
                }

                if (genre == "All Genres") {
                    genreFilter = true;
                } else {
                    genreFilter = d.genres.includes(genre);
                }
                return yearFilter && genreFilter;
            }
        })

    var budgetMaximum = d3.max(filtered, function(d){
        return d.budget;
    });

    scaleX.domain([0, budgetMaximum*1.1]).range([0, widthChart-80]);

    scaleR.domain(extentGross);

    svg.selectAll('.xGrid').remove();
    var xGrid = bubbleChart.append('g')
        .attr('class', 'xGrid')
        .attr('transform', 'translate('+[0, heightChart]+')')
        .call(d3.axisBottom(scaleX)
            .tickSizeInner(-heightChart)
            .tickFormat(d3.format(".2s")));

     var yGrid = bubbleChart.append('g')
        .attr('class', 'yGrid')
        .call(d3.axisLeft(scaleY).ticks(20)
        .tickSizeInner(-widthChart+80)
        .tickFormat(d3.format(".1f")));


    var bChart = bubbleChart.selectAll('.bChart')
        .data(filtered, function(d) { return d.movieTitle});

    var bChartEnter = bChart.enter()
        .append('g')
        .attr('class', 'bChart')
        .on('mouseover', function(d){
            svg.selectAll('.dot')
                .classed('hidden', function(v) {
                    return v != d;
                })
                .classed('hovered', function(v) {
                    return v == d;
                })

            bubbleChart.selectAll('image').remove();
            find = true;

            var matchHovered = svg.selectAll('.bData')
                .classed('hovered', function(i) {
                return (d.movieTitle == i.movieTitle);
            });

            var temporaryKeyWords = d['plotKeywords'].split('|');
            var stringKeyWords = "";
            temporaryKeyWords.forEach(function(d) {
                stringKeyWords += d + ", ";
            })
            stringKeyWords = stringKeyWords.substring(0, stringKeyWords.length - 2);

            var temporaryGenres = d['genres'].split('|');
            var stringGenres = "";
            temporaryGenres.forEach(function(d) {
                stringGenres += d + ", ";
            })
            stringGenres = stringGenres.substring(0, stringGenres.length - 2);

            document.getElementById("title").innerHTML = "Movie: " + "<u>" + d.movieTitle.substring(0, d.movieTitle.length - 1) + "</u>";
            document.getElementById("director").innerHTML = "Director: <u>" + d.directorName + " (" + d3.format(',')(d.directFbLikes) + " likes)</u>";
            document.getElementById("a1").innerHTML = "<u>" + d.actor1 + " (" + d3.format(',')(d.a1Likes) + " likes)</u>, ";
            document.getElementById("a2").innerHTML = "<u>" + d.actor2 + " (" + d3.format(',')(d.a2Likes) + " likes)</u>, and ";
            document.getElementById("a3").innerHTML = "<u>" + d.actor3 + " (" + d3.format(',')(d.a3Likes) + " likes)</u>";
            document.getElementById("gross").innerHTML = "Gross: $" + d3.format(',')(d.gross);
            document.getElementById("budget").innerHTML = "Budget: $" + d3.format(',')(d.budget);
            document.getElementById("duration").innerHTML = "Duration: " + d.duration + " mins";
            document.getElementById("rating").innerHTML = "Age Rating: " + d.contentRating;
            document.getElementById("year").innerHTML = "Year: " + d.year;
            document.getElementById("genres").innerHTML = "Genres: " + stringGenres;
            document.getElementById("aspect").innerHTML = "Aspect Ratio: " + d.aspectRatio;
            document.getElementById("color").innerHTML = "Film Hue: " + d.color;
            document.getElementById("faces").innerHTML = "Faces in Poster: " + d.faceNumInPoster;
            document.getElementById("keywords").innerHTML = "Plot Keywords: " + stringKeyWords;
            document.getElementById("country").innerHTML = "Country: " + d.country;
            document.getElementById("language").innerHTML = "Language: " + d.language;

            setSearchTerm(d.directorName);
            setA1Search(d.actor1);
            setA2Search(d.actor2);
            setA3Search(d.actor3);
            setMovieSearch(d.movieTitle);

        })
        .on('mouseout', function(d){
            find = false;
            var hoverMatched = svg.selectAll('.bData')
            .classed('hovered', function(i) {
                return false;
            });

            svg.selectAll('.dot')
                .classed('hidden', function(v) {
                    return false;
                })
                .classed('hovered', function(v) {
                    return false;
                })

            bubbleChart.selectAll('image').remove();

        })
        .on('click', function(d) {
            var win = window.open(d.imdbLink, '_blank');
            win.focus();
        });

    var bData = bubbleChart.selectAll('.bData')
        .data(movies);

    var bDataEnter = bData.enter()
        .append('g')
        .attr('class', 'bData')
        .attr('transform','translate(' +[widthChart-250, 400]+ ')');


    bChart.merge(bChartEnter)
        .transition()
        .duration(600)
        .attr('transform', function(d){
            return 'translate(' +(scaleX(d.budget))+ ', ' + (scaleY(d.imdbScore)) + ')';
        });

    bChartEnter.append('circle')
        .transition()
        .duration(600)
        .attr('r', function(d) {
            return scaleR(d.gross);
        })
        .style('fill', function(d){
            if (d.contentRating === "G") {
                return '#00ff00';
            } else if (d.contentRating === "PG") {
                return '#29e6ff';
            } else if (d.contentRating === "PG-13") {
                return '#ec973c';
            } else if (d.contentRating === "R") {
                return '#ff0000';
            } else if (d.contentRating === "Unrated") {
                return '#b42695';
            } else if (d.contentRating === "Not Rated") {
                return '#232323';
            } else {

            }
        });

    var legend = bubbleChart.selectAll('.legend')
        .data([1])
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate('+[widthChart - 50, heightChart - 170]+')');

        legend.append('rect')
            .attr('x', 0)
            .attr('y', -30)
            .attr('height', 170)
            .attr('width', 110)
            .style('fill', 'none')
            .style('stroke', 'black');

        legend.append('text')
            .attr('x', 0)
            .attr('y', -20)
            .attr('dy', '0.7em')
            .attr('transform', function(a,b) {
                return 'translate( '+ [10, 15]+ ')';})
            .text('Age Rating')
            .style('font-size', '0.7em')
            .style('text-anchor', 'start');


        colorsLegend.forEach(function(d) {
            var legendItems = legend.selectAll('.legendItems')
                .data(colorsLegend);

            var legendItemsEnter = legendItems.enter()
                .append('g')
                .attr('class', 'legendItems');

            legendItemsEnter.append('rect')
                .attr('x', 20)
                .attr('y', 10)
                .attr('height', 15)
                .attr('width', 15)
                .attr('transform', function(a,b) {
                    return 'translate( '+ [0, b*15 + 10]+ ')';})
                .style('fill', function(d) {return d;})
                .style('opacity', '0.7');

            legendItemsEnter.append('text')
                .attr('x', 40)
                .attr('y', 20)
                .attr('dy', '0.7em')
                .attr('transform', function(a,b) {
                    return 'translate( '+ [0, b*15 + 3]+ ')';})
                .text(function(d,i) {
                    return wordsLegend[i];
                })
                .style('font-size', '0.7em')
                .style('text-anchor', 'start');

        })


    bChartEnter.append('text')
        .attr('dy', '0.7em')
        .attr('transform', 'translate(' +[0, -20]+ ')')
        .text(function(d){
                return d.movieTitle;
            });

    bChart.exit().remove();
    bData.exit().remove();
}
// function to make trellis
function makeTrellis(year, genre, text) {
    svg.selectAll('.dot').remove();

    if(text != '/') {
        filtered = movies.filter(function(d) {
            var title = d['movieTitle'].toLowerCase();
            return title.includes(text.toLowerCase());
        })
    } else {
        var yearsFiltered = movies.filter(function(d){
            if (year == "All") {return true;}
            return year == d.year;
        });

        var yearsGenresFiltered = yearsFiltered.filter(function(d){
            if (genre == "All Genres") {return true;}
            return d.genres.includes(genre);
        });
        filtered = yearsGenresFiltered;
    }

    var charts = trellis.selectAll('.cell')
        .data(attributesX)
        .enter()
        .append('g')
        .attr('class', 'cell')
        .attr("transform", function(d, i) {
            return 'translate(' +[1.2 * widthTrellis * i]+ ')';
        });

    attributesX.forEach(function(attribute, i) {

    var cell = trellis.append('g')
        .attr('class', 'cell')
        .attr("transform", function(d) {
            return 'translate(' +[1.2 * widthTrellis * i]+ ')';
        });


    scaleX.range([0, widthTrellis]).domain(extentMap[attribute]);

    var xAxis = cell.append('g')
        .attr('class', 'trellis axis x')
        .attr('transform', 'translate(' +[0, heightTrellis]+ ')')
        .call(d3.axisBottom(scaleX).ticks(5).tickFormat(d3.format(".2s")))

    var yAxis = cell.append('g')
        .attr('class', 'trellis axis y')
        .call(d3.axisLeft(scaleGross).tickFormat(d3.format(".2s")));

    cell.append('text')
        .attr('class', 'tpyaxis')
        .attr('x', -heightTrellis/2)
        .attr('y', -45)
        .attr('transform', 'rotate(270)')
        .text('Gross ($)');

    cell.append('text')
        .attr('class', 'tpxaxis')
        .attr('x', widthTrellis/2)
        .attr('y', heightTrellis + 35)
        .text(axisMapY[attribute]);

    var dots = cell.selectAll('.dot')
        .data(filtered);

    var dotsEnter = dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', 2.5)
        .style('fill', colorOfTrellis[attribute]);

    dots.merge(dotsEnter)
        .attr('cx', function(d) {

            return scaleX(d[attribute]);
        })
        .attr('cy', function(d) {
            return scaleGross(d['gross']);
        })

    dots.exit().remove()
    })
}
//function to search for director
function searchDirector() {
    if (directorCurrent == "none") {
        window.alert("No Director Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + directorCurrent, '_blank');
    win.focus();
}
// function to search for first actor
function searchActor1() {
    if (a1Current == "none") {
        window.alert("No Actor Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + a1Current, '_blank');
    win.focus();
}
// function to search for second actor
function searchActor2() {
    if (a2Current == "none") {
        window.alert("No Actor Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + a2Current, '_blank');
    win.focus();
}
//function to search for third actor
function searchActor3() {
    if (a3Current == "none") {
        window.alert("No Actor Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + a3Current, '_blank');
    win.focus();
}
//function to search for movie
function searchMovie() {
    if (a3Current == "none") {
        window.alert("No Movie Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + movieCurrent, '_blank');
    win.focus();
}
// function to set the search term
function setSearchTerm(name) {
    directorCurrent = name;
}
// function to set A1 search
function setA1Search(name) {
    a1Current = name;
}
// function to set A2 search
function setA2Search(name) {
    a2Current = name;
}
// function to set A3 search
function setA3Search(name) {
    a3Current = name;
}
// function to set movie search
function setMovieSearch(name) {
    movieCurrent = name;
}
// function for clearing all filters
function clearAllFilters() {
    d3.select('#searchInput').node().value = "";
    updateChart(yearSelected, genreSelected, '/');
    makeTrellis(yearSelected, genreSelected, '/');

    yearSelected = "All";
    genreSelected = "All Genres";
    updateChart(yearSelected, genreSelected, '/');
    makeTrellis(yearSelected, genreSelected, '/');

    var val = "All";
    var sel = document.getElementById('yearSelect');
    var opts = sel.options;
    for (var opt, j = 0; opt = opts[j]; j++) {
        if (opt.value == val) {
          sel.selectedIndex = j;
          break;
        }
    }

    var valG = "All Genres";
    var selG = document.getElementById('genreSelect');
    var optsG = selG.options;
    for (var optG, j = 0; optG = optsG[j]; j++) {
        if (optG.value == valG) {
          selG.selectedIndex = j;
          break;
        }
    }

}

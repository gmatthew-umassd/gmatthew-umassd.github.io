function simulate(data, svg){
    // Get width from value at index 2 after splitting the svg's viewBox attribute on space char
    let width = parseInt(svg.attr("viewBox").split(' ')[2])

    // Get height from value at index 3 after splitting the svg's viewBox attribute on space char
    let height = parseInt(svg.attr("viewBox").split(' ')[3])

    let mainGroup = svg.append("g")
        .attr("transform", "translate(-25, 25)")

    let nodeDegree = {}
    d3.map(data.links, (d) => {
        // If node is a source
        if (nodeDegree.hasOwnProperty(d.source)){
            nodeDegree[d.source]++
        } else {
            nodeDegree[d.source] = 0
        }

        // If node is a target
        if (nodeDegree.hasOwnProperty(d.target)){
            nodeDegree[d.target]++
        } else {
            nodeDegree[d.target] = 0
        }
    })

    let nodeCitations = {}
    d3.map(data.nodes, (d) => {
        nodeCitations[d.id] = d.Citations
    })

    let scaleRadius = d3.scaleSqrt()
        .domain(d3.extent(Object.values(nodeCitations)))
        .range([3, 13])

    let scaleColor = d3.scaleSequential()
        .domain([1995, 2020])
        .interpolator(d3.interpolateViridis)

    let linkElements = mainGroup.append("g")
        .attr("transform", `translate(${width/2}, ${height/2})`)
        .selectAll(".line")
        .data(data.links)
        .enter()
        .append("line")

    const treatFirstAuthorCountryClass = (FirstAuthorCountry) => {
        // Remove spaces from the country
        return "gr" +
            FirstAuthorCountry.toString()
            .split(" ")
            .join("")
            .replaceAll(".", "")
    }
    let nodeElements = mainGroup.append("g")
        .attr("transform", `translate(${width/2}, ${height/2})`)
        .selectAll(".circle")
        .data(data.nodes)
        .enter()
        .append("g")
        .attr("class", d => {
            return treatFirstAuthorCountryClass(d.FirstAuthorCountry)
        })
        .on("mouseover", function(d, data) {
            d3.selectAll("#details-content").html(`<b>Title</b>: ${data.Title}<br>` +
                                          `<b>Country:</b> ${data.FirstAuthorCountry}<br>` +
                                          `<b>Citations:</b> ${data.Citations}`
            )
            // Initialize all nodes to inactive class
            nodeElements.classed("inactive", true)
            // Get class name (gr + first author's country)
            const selectedClass = d3.select(this)
                .attr("class")
                .split(" ")[0]
            // Set all nodes in the author's first country class to active
            d3.selectAll("." + selectedClass).classed("inactive", false)
        })
        // When the mouse leaves the node, reset all nodes back to active
        .on("mouseout", function(d, data) {
            d3.select("#details-content").html(`<b>Title</b>: <br>` +
                                               `<b>Country:</b> <br>` +
                                               `<b>Citations:</b> `
            )
            d3.selectAll(".inactive").classed("inactive", false)
        })
    nodeElements.append("circle")
        .attr("r", (d, i) => {
            if(nodeDegree[d.id]!==undefined){
                return scaleRadius(nodeCitations[d.id])
            } else {
                return scaleRadius(0)
            }
        })
        .attr("fill", (d, i) => {
            return scaleColor(d.Year)
        })

    let forceSimulation = d3.forceSimulation(data.nodes)
        .force("collide",
            d3.forceCollide()
                .radius((d, i) => {
                    return scaleRadius(nodeCitations[d.id]) * 1.2
                }))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(data.links)
            .id((d) => { return d.id }))
        .on("tick", ticked)

    function ticked(){
        nodeElements
            .attr('transform', function(d){return `translate(${d.x},${d.y})`})
        linkElements
            .attr("x1",function(d){return d.source.x})
            .attr("x2",function(d){return d.target.x})
            .attr("y1",function(d){return d.source.y})
            .attr("y2",function(d){return d.target.y})
    }

    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", zoomed));
    function zoomed({transform}) {
        mainGroup.attr("transform", transform);
    }
}
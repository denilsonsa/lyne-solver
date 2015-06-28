'use strict';

function min(a, b) {
	if (a < b) {
		return a;
	} else {
		return b;
	}
}

function max(a, b) {
	if (a > b) {
		return a;
	} else {
		return b;
	}
}

// Returns a random number x, where 0 <= x < n.
function randrange(n) {
	return Math.floor(Math.random() * n);
}

// Shuffles the array in-place.
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
// http://bost.ocks.org/mike/shuffle/
// http://www.robweir.com/blog/2010/02/microsoft-random-browser-ballot.html
function shuffle(arr) {
	for (var i = arr.length; i > 1; i--) {
		var j = randrange(i);
		var tmp = arr[i - 1];
		arr[i - 1] = arr[j];
		arr[j] = tmp;
	}
}

//////////////////////////////////////////////////////////////////////
// Data structures.

function Direction(dx, dy, char, name, restriction_direction) {
	this.dx = dx;
	this.dy = dy;
	this.char = char;  // Used only when converting to text.
	this.name = name;  // Unused.
	// One of: 'v' for vertical, 'h' for horizontal, 'd' for diagonal.
	this.restriction_direction = restriction_direction;
}

// Each edge will block other edges in the same restriction_direction and with
// the same coordinates.
Direction.prototype.get_restriction_name = function(x, y) {
	x += min(0, this.dx);
	y += min(0, this.dy);
	return this.restriction_direction + '_' + x + '_' + y;
};

var DIRECTIONS = [
	new Direction( 0, -1,  '|', 'up'        , 'v'),
	new Direction( 1, -1,  '/', 'up_right'  , 'd'),
	new Direction( 1,  0,  '-', 'right'     , 'h'),
	new Direction( 1,  1, '\\', 'down_right', 'd'),
	new Direction( 0,  1,  '|', 'down'      , 'v'),
	new Direction(-1,  1,  '/', 'down_left' , 'd'),
	new Direction(-1,  0,  '-', 'left'      , 'h'),
	new Direction(-1, -1, '\\', 'up_left'   , 'd')
];

function Edge(dir, color) {
	this.direction = dir;
	this.color = color;
}

function Node(color, max_edges) {
	// null (for gray multi-color nodes) or a lower-case string.
	this.color = color;
	// 1 for terminator nodes, 2 for single-color nodes, multiples of 2 for gray nodes.
	this.max_edges = max_edges;
	this.missing_edges = max_edges;
	// List of Edge objects.
	this.edges = [];
}

function Board() {
	this.width = 0;
	this.height = 0;
	this.errors = [];  // Empty array if no errors.
	this.nodes = [];  // Array of Array of Nodes (i.e. a matrix of Nodes).
	this.terminators = [];  // List of positions {x:0,y:0} of terminator nodes.
	this.edge_count = 0;  // Number of edges in the solution.
	this.solution_found = null;  // null, true, false.

	// Temporary variables used while solving the board.
	this.incomplete_nodes = 0;
	this.edge_restrictions = {};  // Map blocked edges (String -> true).
	this.starting_points = [];  // List of terminators that are not completed yet.
}


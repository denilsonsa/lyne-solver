'use strict';

var g_board = null;

function min(a, b) {
	if (a < b) {
		return a;
	} else {
		return b;
	}
}

function Direction(dx, dy, char, name, restriction_direction) {
	this.dx = dx;
	this.dy = dy;
	this.char = char;
	this.name = name;
	this.restriction_direction = restriction_direction;
}

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

function _solve_board_recursive(board, starting_points, x, y, color) {
	if (x === null && y === null) {
		if (starting_points.length === 0) {
			if (board.incomplete_nodes === 0) {
				// Found a solution!
				return true;
			} else if (board.incomplete_nodes < 0) {
				console.error('board.incomplete_nodes == ' + board.incomplete_nodes);
				return false;
			} else {
				return false;
			}
		} else {
			// Start a new path.
			var p = starting_points.pop();
			var found = _solve_board_recursive(board, starting_points, p.x, p.y, board.nodes[p.y][p.x].color);
			if (found) return found;
			starting_points.push(p);
			return false;
		}
	} else {
		// Continue an existing path.
		var src_node = board.nodes[y][x];

		if (src_node.missing_edges === 0) {
			// End of a path.
			return _solve_board_recursive(board, starting_points, null, null, null);
		} else {
			// Middle of a path.
			for (var dir of DIRECTIONS) {
				var dx = x + dir.dx;
				var dy = y + dir.dy;

				// Out-of-bounds.
				if (dx < 0 || dy < 0 || dy >= board.nodes.length || dx >= board.nodes[y].length) {
					continue;
				}

				// Edge blocking.
				var restriction = dir.get_restriction_name(x, y);
				if (board.edge_restrictions[restriction]) {
					continue;
				}

				// Adjacent node.
				var node = board.nodes[dy][dx];

				// Invalid node (empty space).
				if (!node) {
					continue;
				}
				// Already completed node.
				if (node.missing_edges <= 0) {
					continue;
				}

				// Incompatible color.
				if (node.color !== null && node.color !== color) {
					continue;
				}

				// Valid node, proceed building the solution.
				src_node.edges.push(new Edge(dir, color));
				src_node.missing_edges--;
				if (src_node.missing_edges === 0) {
					board.incomplete_nodes--;
				}
				node.missing_edges--;
				if (node.missing_edges === 0) {
					board.incomplete_nodes--;
				}
				board.edge_restrictions[restriction] = true;

				var found = _solve_board_recursive(board, starting_points, dx, dy, color);
				if (found) return found;

				delete board.edge_restrictions[restriction];
				if (node.missing_edges === 0) {
					board.incomplete_nodes++;
				}
				node.missing_edges++;
				if (src_node.missing_edges === 0) {
					board.incomplete_nodes++;
				}
				src_node.missing_edges++;
				src_node.edges.pop();
			}  // for loop for DIRECTIONS
			return false;
		}
	}
}

function solve_board(board) {
	// Clearing any previous solution.
	board.incomplete_nodes = 0;
	for (var i = 0; i < board.nodes.length; i++) {
		for (var j = 0; j < board.nodes[i].length; j++) {
			var node = board.nodes[i][j];
			if (node) {
				node.edges = [];
				node.missing_edges = node.max_edges;
				if (node.missing_edges > 0) {
					board.incomplete_nodes++;
				}
			}
		}
	}
	board.edge_restrictions = {};

	var starting_points = board.terminators.slice();  // A copy of the array.

	var found = _solve_board_recursive(board, starting_points, null, null, null);
	return found;
}

// Receives an already solved board and returns a multi-line string with the solution.
function solution_to_text(board) {
	var sol = [];

	// Nodes.
	for (var i = 0; i < board.height; i++) {
		var line1 = [];
		var line2 = [];
		for (var j = 0; j < board.width; j++) {
			var name = ' ';
			var node = board.nodes[i][j];
			if (node) {
				if (node.max_edges === 1) {
					name = node.color.toUpperCase();
				} else {
					name = node.color || '*';
				}
			}
			line1.push(name, ' ');
			line2.push(' ', ' ');
		}
		sol.push(line1, line2);
	}

	// Edges.
	for (var i = 0; i < board.height; i++) {
		for (var j = 0; j < board.width; j++) {
			var node = board.nodes[i][j];
			if (node) {
				for (var k = 0; k < node.edges.length; k++) {
					var edge = node.edges[k];

					var x = j * 2 + edge.direction.dx;
					var y = i * 2 + edge.direction.dy;
					var c = edge.direction.char;
					sol[y][x] = c;
					// Edge color is ignored here.
				}
			}
		}
	}


	var ret = '';
	for (var i = 0; i < sol.length; i++) {
		ret += sol[i].join('') + '\n';
	}
	return ret;
}

function build_svg_from_board(board) {
	var svg = document.getElementById('svgsolution');
	var group = document.getElementById('svgsolutiongroup');
	group.innerHTML = '';

	// TODO: rename the colors from r/b/y to shapes s/d/t
	var edge_colors = {
		'r': '#fc1f20',
		'b': '#0086ff',
		'y': '#ffa515'
	};

	// TODO: Seems to have no effect.
	// TODO: Create some scaling and group it.
	//svg.setAttributeNS(svgNS, 'viewBox', '0 0 ' + (board.width * 2 - 1) + ' ' + (board.height * 2 - 1));

	var groupInnerHTML = '';

	for (var i = 0; i < board.height; i++) {
		for (var j = 0; j < board.width; j++) {
			var node = board.nodes[i][j];
			if (node) {
				for (var k = 0; k < node.edges.length; k++) {
					var edge = node.edges[k];
					groupInnerHTML += '<line class="edge" stroke="' + edge_colors[edge.color] + '" x1="' + (j * 1.5 + 0.5) + '" y1="' + (i * 1.5 + 0.5) + '" x2="' + ((j + edge.direction.dx) * 1.5 + 0.5) + '" y2="' + ((i + edge.direction.dy) * 1.5 + 0.5) + '" />';
				}
			}
		}
	}

	for (var i = 0; i < board.height; i++) {
		for (var j = 0; j < board.width; j++) {
			var node = board.nodes[i][j];
			if (node) {
				var name = '';
				if (node.max_edges === 1) {
					name = node.color.toUpperCase();
				} else if (node.color) {
					name = node.color;
				} else {
					name = Math.floor(node.max_edges / 2) + '';
				}

				// It is impossible to dynamically create a <use> element and then modify its attributes.
				// var svgNS = 'http://www.w3.org/2000/svg';
				// var xlinkNS = 'http://www.w3.org/1999/xlink';
				// var use = document.createElementNS(svgNS, 'use');
				// use.setAttributeNS(xlinkNS, 'href', '#node_' + name);
				// use.setAttributeNS(svgNS, 'x', j * 2);
				// use.setAttributeNS(svgNS, 'y', i * 2);
				// use.setAttributeNS(svgNS, 'width', 1);
				// use.setAttributeNS(svgNS, 'height', 1);
				// group.appendChild(use);

				groupInnerHTML += '<use xlink:href="#node_' + name + '" x="' + (j * 1.5) + '" y="' + (i * 1.5) + '" width="1" height="1" />';
			}
		}
	}

	group.innerHTML = groupInnerHTML;
}

// Receives an array of strings, where each string is one line.
function parse_text_input(lines) {
	var board = {
		'width': 0,
		'height': 0,
		'errors': [],
		'nodes': [],
		'terminators': []
	};
	var terminator_count = {};
	for (var i = 0; i < lines.length; i++) {
		board.nodes[i] = [];
		for (var j = 0; j < lines[i].length; j++) {
			var c = lines[i][j];
			if (c == ' ' || c == '0') {
				board.nodes[i][j] = null;
			} else if (c >= '1' && c <= '9') {
				var num = parseInt(c, 10);
				board.nodes[i][j] = new Node(null, 2 * num);
			} else if (c >= 'a' && c <= 'z') {
				board.nodes[i][j] = new Node(c, 2);
			} else if (c >= 'A' && c <= 'Z') {
				board.nodes[i][j] = new Node(c.toLowerCase(), 1);
				board.terminators.push({'x': j, 'y': i});
				terminator_count[c] = (terminator_count[c] || 0) + 1;
			}
		}
		if (j > board.width){
			board.width = j;
		}
	}
	board.height = i;

	if (terminator_count.length == 0) {
		board.errors.push('No terminator node was found.');
	}
	for (var i in terminator_count) {
		if (terminator_count[i] != 2) {
			board.errors.push('There are ' + terminator_count[i] + ' terminators of type ' + i + ', but only 2 are expected.');
		}
	}

	return board;
}


function parse_board_from_input() {
	var puzzleinput = document.getElementById('puzzleinput');
	var lines = puzzleinput.value.split(/[\r\n]+/);
	var board = parse_text_input(lines);

	var messages = document.getElementById('messages');
	messages.value = board.errors.join('\n');

	g_board = board;
	return board;
}


function puzzleinput_input_handler() {
	parse_board_from_input();
	build_svg_from_board(g_board);
}

function solvebutton_click_handler() {
	parse_board_from_input();

	if (g_board.errors.length === 0) {
		var messages = document.getElementById('messages');
		var found = solve_board(g_board);
		if (found) {
			messages.value = 'Solution found!';
		} else {
			messages.value = 'No solution was found. :(';
		}

		//console.log(solution_to_text(g_board));
		build_svg_from_board(g_board);
	}
}

function init() {
	var solvebutton = document.getElementById('solvebutton');
	solvebutton.addEventListener('click', solvebutton_click_handler);

	var puzzleinput = document.getElementById('puzzleinput');
	puzzleinput.addEventListener('input', puzzleinput_input_handler);

	puzzleinput_input_handler();
}

// This script should be included with "defer" attribute.
init();

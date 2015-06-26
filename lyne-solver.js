'use strict';

function min(a, b) {
	if (a < b) {
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

	// Temporary variables used while solving the board.
	this.incomplete_nodes = 0;
	this.edge_restrictions = {};  // Map blocked edges (String -> true).
	this.starting_points = [];  // List of terminators that are not completed yet.
}

//////////////////////////////////////////////////////////////////////
// Solving the board.
//
// The board is solved using a straight-forward, brute-force, backtracking
// algorithm. The algorithm tries every possible combination and stops when one
// solution is found.
//
// It is possible to adapt this code to find all solutions. However, care must
// be taken to remove duplicate solutions, because the algorithm will find the
// same solution multiple times (e.g. will find the A->B solution as well as
// the A<-B one, but both are actually the same solution).

function _solve_board_recursive(board, x, y, color) {
	if (x === null && y === null) {
		if (board.starting_points.length === 0) {
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
			var p = board.starting_points.pop();
			var found = _solve_board_recursive(board, p.x, p.y, board.nodes[p.y][p.x].color);
			if (found) return found;
			board.starting_points.push(p);
			return false;
		}
	} else {
		// Continue an existing path.
		var src_node = board.nodes[y][x];

		if (src_node.missing_edges === 0) {
			// End of a path.
			return _solve_board_recursive(board, null, null, null);
		} else {
			// Middle of a path.
			for (var i = 0; i < DIRECTIONS.length; i++) {
				var dir = DIRECTIONS[i];
				var dx = x + dir.dx;
				var dy = y + dir.dy;

				// Out-of-bounds.
				if (dx < 0 || dy < 0 || dy >= board.nodes.length || dx >= board.nodes[dy].length) {
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
				board.edge_count++;
				board.edge_restrictions[restriction] = true;

				// Recursive call.
				var found = _solve_board_recursive(board, dx, dy, color);
				if (found) return found;

				// Undoing (back-tracking) this step.
				delete board.edge_restrictions[restriction];
				board.edge_count--;
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

function clear_solution(board) {
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
	board.edge_count = 0;
	board.edge_restrictions = {};
}

function solve_board(board) {
	clear_solution(board);

	board.starting_points = board.terminators.slice();  // A copy of the array.

	var found = _solve_board_recursive(board, null, null, null);
	return found;
}

//////////////////////////////////////////////////////////////////////
// Text/board conversion.

// Receives an array of strings, where each string is one line.
// Returns a board.
function parse_text_input(lines) {
	var board = new Board();
	var terminator_count = {};
	for (var i = 0; i < lines.length; i++) {
		board.nodes[i] = [];
		for (var j = 0; j < lines[i].length; j++) {
			var c = lines[i][j];
			if (c == ' ' || c == '0') {
				board.nodes[i][j] = null;
			} else if (c >= '1' && c <= '4') {
				var num = parseInt(c, 10);
				board.nodes[i][j] = new Node(null, 2 * num);
			} else if (c >= 'a' && c <= 'z') {
				board.nodes[i][j] = new Node(c, 2);
			} else if (c >= 'A' && c <= 'Z') {
				board.nodes[i][j] = new Node(c.toLowerCase(), 1);
				board.terminators.push({'x': j, 'y': i});
				terminator_count[c] = (terminator_count[c] || 0) + 1;
			} else {
				board.errors.push('Invalid character: ' + c);
			}
		}
		if (j > board.width){
			board.width = j;
		}
	}
	board.height = i;

	if (board.width < 1 || board.height < 1) {
		board.errors.push('Empty board.');
	}

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

// Receives an already solved board.
// Returns a multi-line string with the solution in ASCII drawing.
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

//////////////////////////////////////////////////////////////////////
// DOM-related and UI-related manipulation.

function parse_board_from_input() {
	var puzzleinput = document.getElementById('puzzleinput');
	var lines = puzzleinput.value.split(/[\r\n]+/);
	var board = parse_text_input(lines);

	var messages = document.getElementById('messages');
	messages.innerHTML = board.errors.join('\n');

	return board;
}

function build_svg_from_board(board) {
	if (board.width < 1 || board.height < 1) {
		return;
	}

	var container = document.getElementById('svgsolutioncontainer');

	var svg_code = '';

	var width = (board.width * 1.5 - 0.5);
	var height = (board.height * 1.5 - 0.5);
	svg_code += '<svg preserveAspectRatio="xMidYMin" viewBox="0 0 ' + width + ' ' + height + '">';

	var edge_colors = {
		's': '#fc1f20',
		'd': '#0086ff',
		't': '#ffa515',
		'p': '#009e00',
		'h': '#ca197d'
	};

	var revealrange = document.getElementById('revealrange');
	if (board.edge_count === 0) {
		revealrange.disabled = true;
	} else {
		revealrange.disabled = false;

		// remember if value was at maximum
		var shouldmax = revealrange.value == revealrange.max;
		
		revealrange.max = board.edge_count;
		
		// if value was already at maximum before, the user likely wants the value at maximum again
		if (shouldmax) {
			revealrange.value = revealrange.max;
		}

		var random_numbers = [];
		for (var i = 0; i < board.edge_count; i++) {
			random_numbers[i] = i;
		}
		shuffle(random_numbers);

		var isDirectional = document.getElementById('directional').checked;

		// Building the edges.
		for (var i = 0; i < board.height; i++) {
			for (var j = 0; j < board.width; j++) {
				var node = board.nodes[i][j];
				if (node) {
					for (var k = 0; k < node.edges.length; k++) {
						var edge = node.edges[k];
						var n = random_numbers.pop();
						
						var startX = (j * 1.5 + 0.5),
							startY = (i * 1.5 + 0.5),
							endX = ((j + edge.direction.dx) * 1.5 + 0.5),
							endY = ((i + edge.direction.dy) * 1.5 + 0.5);


						if (isDirectional) {
							var midX = (startX + endX) / 2,
								midY = (startY + endY) / 2;

							// if directional, draw the line in two segments, one of them larger.
							svg_code += '<line class="edge" id="edge' + n + 
								'" stroke="' + edge_colors[edge.color] + 
								'" x1="' + startX + 
								'" y1="' + startY + 
								'" x2="' + midX + 
								'" y2="' + midY + '" />';
							svg_code += '<line class="edge edgewide" id="edge' + n + 'x' +
								'" stroke="' + edge_colors[edge.color] + 
								'" x1="' + midX + 
								'" y1="' + midY + 
								'" x2="' + endX + 
								'" y2="' + endY + '" />';
						} else {
							svg_code += '<line class="edge" id="edge' + n + 
								'" stroke="' + edge_colors[edge.color] + 
								'" x1="' + startX + 
								'" y1="' + startY + 
								'" x2="' + endX + 
								'" y2="' + endY + '" />';
						}
						
					}
				}
			}
		}
	}

	// Building the nodes.
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

				svg_code += '<use xlink:href="#node_' + name + '" x="' + (j * 1.5) + '" y="' + (i * 1.5) + '" width="1" height="1" />';
			}
		}
	}

	svg_code += '</svg>';
	container.innerHTML = svg_code;

	reveal_edges(revealrange.value);
}

function reveal_edges(how_many) {
	var all_edges = document.querySelectorAll('#svgsolutioncontainer > svg .edge');
	for (var i = 0; i < all_edges.length; i++) {
		all_edges[i].style.display = 'none';
	}
	for (var i = 0; i < how_many; i++) {
		var edge = document.getElementById('edge' + i),
			edgex = document.getElementById('edge' + i + 'x');
		
		if (edge) {
			edge.style.display = 'block';
		}
		if (edgex) {
			edgex.style.display = 'block';
		}
	}
}

var lastBoard;

//////////////////////////////////////////////////////////////////////
// Event handling.

function puzzleinput_input_handler() {
	var board = lastBoard = parse_board_from_input();
	build_svg_from_board(board);

	var autosolve = document.getElementById('autosolve');
	if (autosolve.checked) {
		solvebutton_click_handler();
	}
}

function solvebutton_click_handler() {
	var board = lastBoard = parse_board_from_input();

	if (board.errors.length === 0) {
		var messages = document.getElementById('messages');
		var found = solve_board(board);
		if (found) {
			messages.innerHTML = 'Solution found!';
		} else {
			messages.innerHTML = 'No solution was found. :(';
		}

		//console.log(solution_to_text(board));
		build_svg_from_board(board);
	}
}

function revealrange_input_handler() {
	var revealrange = document.getElementById('revealrange');
	reveal_edges(revealrange.value);
}

function directional_input_handler () {
	if (lastBoard) {
		build_svg_from_board(lastBoard);
		revealrange_input_handler();
	}
}

function init() {
	var solvebutton = document.getElementById('solvebutton');
	solvebutton.addEventListener('click', solvebutton_click_handler);

	var puzzleinput = document.getElementById('puzzleinput');
	puzzleinput.addEventListener('input', puzzleinput_input_handler);

	var revealrange = document.getElementById('revealrange');
	revealrange.addEventListener('change', revealrange_input_handler);
	revealrange.addEventListener('input', revealrange_input_handler);

	var directional = document.getElementById('directional');
	directional.addEventListener('change', directional_input_handler);
	
	puzzleinput_input_handler();
}

// This script should be included with "defer" attribute.
init();

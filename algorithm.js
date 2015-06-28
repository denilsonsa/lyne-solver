'use strict';

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
				console.error('board.incomplete_nodes: ' + board.incomplete_nodes);
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

			// for (var dir of DIRECTIONS) {
			for (var dir_index = 0; dir_index < DIRECTIONS.length; dir_index++) {
				var dir = DIRECTIONS[dir_index];

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
	board.solution_found = found;
}

//////////////////////////////////////////////////////////////////////
// Web Worker initialization.

importScripts('shared.js');

onmessage = function(e) {
	var board = e.data;
	solve_board(board);
	postMessage(board);
}

function shape (shape_rotations, colour, x=0, y=3, z=0) {
   
   this.rotations = shape_rotations;
   this.colour = colour;
   this.row = x;
   this.col = y;
   this.rotation = z;
   
   this.form_grid = function () {

      var binary_str = "";
      var shape_rotation = this.rotations[this.rotation]
      for (
         var i=0;
         i<16 - shape_rotation.toString(2).length;
         i++
      ){
         binary_str += "0";
      }
      binary_str += shape_rotation.toString(2);
      grid = [];
      var i = 0;
    
      for (var j=0; j<binary_str.length; j+=4) {
         grid[i] = [];   
         for (var k=j; k<j + 4; k++) {
            grid[i].push(
               parseInt(binary_str.charAt(k))
            );
         }
         i++;
      }
      return grid
   }
   
   this.get_coords = function () {

      grid = this.form_grid()
      coords = []	  
      for (var i=0; i<grid.length; i++) {
         for (var j=0; j<grid[i].length; j++) {
            if (grid[i][j]) {
               coords.push({row: i, col: j});
            }
         }
      }
      return coords;
   }
}


function block () {

   this.colour = 'grey';
   this.occupied = false;

}
   

function game_engine () {

   this.main_div = document.getElementById('main');
   this.canvas = document.getElementsByTagName("canvas")[0];
   this.ctx = this.canvas.getContext("2d");
   this.ctx.width = 300;
   this.ctx.height = 600;

   this.canvas2 = document.getElementsByTagName("canvas")[1];
   this.ctx2 = this.canvas2.getContext("2d");
   this.ctx2.width = 120;
   this.ctx2.height = 120;
   
   this.cols = 10;
   this.rows = 20;
   this.cell_width = this.ctx.width / this.cols;
   this.cell_height = this.ctx.height / this.rows;

   this.mino_queue = [];

   this.score_card = document.getElementById('score_sheet');
   this.game_score = document.getElementById('score');
   this.level = 0;
   this.score = 0;
   this.points = [40, 100, 300, 1200];
   
   this.shapes = [
     //degrees:    0       90      180     270
      {rotations: [0x0F00, 0x2222, 0x00F0, 0x4444], colour: 'cyan'},     //I
      {rotations: [0x44C0, 0x8E00, 0x6440, 0x0E20], colour: 'blue'},     //J
      {rotations: [0x4460, 0x0E80, 0xC440, 0x2E00], colour: 'orange'},   //L
      {rotations: [0xCC00, 0xCC00, 0xCC00, 0xCC00], colour: 'yellow'},   //O
      {rotations: [0x06C0, 0x8C40, 0x6C00, 0x4620], colour: 'green'},    //S
      {rotations: [0x0E40, 0x4C40, 0x4E00, 0x4640], colour: 'purple'},   //T
      {rotations: [0x0C60, 0x4C80, 0xC600, 0x2640], colour: 'red'}       //Z
   ];
   
   this.keys = {
      esc: 27,
      space: 32,
      left_: 37,
      up: 38,
      right_: 39,
      down: 40
   }

   this.build_board = function () {
      
      brd = [];      
      for (var row=0; row<this.rows; row++) {      
         brd[row] = [];
         for (var col=0; col<this.cols; col++) {         
            brd[row][col] = new block();
         }
      }
      return brd;
   }

   this.board = this.build_board();

   this.random_mino = function () {
      
      if (this.mino_queue.length < 2) {
         for (var i=0; i<4; i++) {
            for (var j=0; j<this.shapes.length; j++) {
               this.mino_queue.push(
                  new shape(
                     this.shapes[j].rotations,
                     this.shapes[j].colour
                  )
               );
            }
         }
      }
      
      return this.mino_queue.splice(
         Math.round(Math.random(0, this.mino_queue.length-1)),
         1
      )[0];
   }

   this.current_shape = this.random_mino();
   this.next_shape = this.random_mino();
   
   this.rotate = function () {
      
      var potential_rotation;
      
      if (this.current_shape.rotation == 3) {
         potential_rotation = 0;
      }  
      else {
         potential_rotation = this.current_shape.rotation + 1;
      }
      var potential = new shape(
         this.current_shape.rotations,
         this.current_shape.colour,
         this.current_shape.row,
         this.current_shape.col,
         potential_rotation
      );
      if (this.space_free(potential)) {
         if (this.current_shape.rotation == 3) {
            this.current_shape.rotation = 0;
         }  
         else {
            this.current_shape.rotation++;
         }
      }
   }

   this.move_left = function () {

      var potential = new shape(
         this.current_shape.rotations,
         this.current_shape.colour,
         this.current_shape.row,
         this.current_shape.col - 1,
         this.current_shape.rotation
      );
      if (this.space_free(potential)) {
         this.current_shape.col--;
      }
   }

   this.move_right = function () {

      var potential = new shape(
         this.current_shape.rotations,
         this.current_shape.colour,
         this.current_shape.row,
         this.current_shape.col + 1,
         this.current_shape.rotation
      );
      if (this.space_free(potential)) {
         this.current_shape.col++;
      }
   }

   this.move_down = function () {

      var potential = new shape(
         this.current_shape.rotations,
         this.current_shape.colour,
         this.current_shape.row + 1,
         this.current_shape.col,
         this.current_shape.rotation
      );
      if (this.space_free(potential)) {
         this.current_shape.row++;
      }
      else {
	      this.land();
	      return false;
      }
      return true;
   }

   this.drop = function () {
      moved = true;
      while (moved) {
         moved = this.move_down(this.current_shape);
      }
   }
      
   this.space_free = function (shape) {

      coords = shape.get_coords();

      for (var i=0; i<coords.length; i++) {
         if (
            shape.col + coords[i].col >= 0 &&            
            shape.col + coords[i].col < this.cols &&
            shape.row + coords[i].row < this.rows
         ) {
            if (
               this.board[
                     shape.row + coords[i].row
                  ][
                     shape.col + coords[i].col
                  ].occupied
            ) {
               return false;
            }
         }
         else {
            return false;
         }
      }
      return true;
   }
   
   this.land = function () {

      coords = this.current_shape.get_coords();

      for (var i=0; i<coords.length; i++) {
         this.board[
               this.current_shape.row + coords[i].row
            ][
               this.current_shape.col + coords[i].col
         ].occupied = true;
         this.board[
               this.current_shape.row + coords[i].row
            ][
               this.current_shape.col + coords[i].col
         ].colour = this.current_shape.colour;
      }
      this.check_lines();
      this.current_shape = this.next_shape;
      this.next_shape = this.random_mino();
      this.render_next_piece();
      if (!this.space_free(this.current_shape)) {
         this.lose();
      }
       
   }
   
   this.check_lines = function () {

      full_rows = []
      for (var row=0; row<this.board.length; row++) {
         full_row = true;
         for (var col=0; col<this.board[row].length; col++) {
            if (!this.board[row][col].occupied) {
               full_row = false;
            }
         }
         if (full_row) {
            full_rows.push(row);
         }
      }
	
	   this.update_score(full_rows.length);

      while (full_rows.length>0) { 
         this.board.splice(full_rows.pop(), 1);
      }

      while (this.board.length<this.rows) {
         row = [];
         while (row.length<this.cols) {
            row.push(new block());
         }
         this.board.unshift(row);
      }
   }

   this.update_score = function(lines) {
	   if(lines) {
	      this.score += this.points[lines-1] * (this.level + 1);
	   }
   }
      
   this.clear_screen = function () {
      this.ctx.clearRect (0, 0, this.ctx.width, this.ctx.height);
   }
   
   this.render_board = function () {

      for (var row=0; row<this.rows; row++) {
         for (var col=0; col<this.cols; col++) {
            if(this.board[row][col].occupied) {
               this.ctx.strokeStyle = 'grey';
            }
            else {
               this.ctx.strokeStyle = 'black';
            }
            this.ctx.fillStyle = this.board[row][col].colour;                     
            this.ctx.fillRect(
               col * this.cell_height,
               row * this.cell_width,
               this.cell_height,
               this.cell_width
            );
            this.ctx.strokeRect(
               col * this.cell_height,
               row * this.cell_width,
               this.cell_height,
               this.cell_width
            );
         }
      }
   }

   this.render_piece = function () {
     
      this.ctx.fillStyle = this.current_shape.colour;
      this.ctx.strokeStyle = 'grey';
      shape_coords = this.current_shape.get_coords();
     
      for (var i=0; i<shape_coords.length; i++) {
         this.ctx.fillRect(
            (
               (this.current_shape.col + shape_coords[i].col) *
               this.cell_height
            ),            
            (            
               (this.current_shape.row + shape_coords[i].row) * 
               this.cell_width
            ),
            this.cell_width,             
            this.cell_height
         );
         this.ctx.strokeRect(
            (
               (this.current_shape.col + shape_coords[i].col) * 
               this.cell_height
            ),
            (
               (this.current_shape.row + shape_coords[i].row) *
               this.cell_width               
            ),
            this.cell_height,
            this.cell_width
         );
      }
   }
   
   this.render_next_piece = function () {

		shape_grid = this.next_shape.form_grid();

      for (var row=0; row<shape_grid.length; row++) {
         for (var col=0; col<shape_grid[row].length; col++) {

            if(shape_grid[row][col]) {
               this.ctx2.strokeStyle = 'grey';
               this.ctx2.fillStyle = this.next_shape.colour;
            }
            else {
               this.ctx2.strokeStyle = 'black';
               this.ctx2.fillStyle = 'grey';
            }
            this.ctx2.fillRect(
               col * this.cell_height,
               row * this.cell_width,
               this.cell_height,
               this.cell_width
            );
            this.ctx2.strokeRect(
               col * this.cell_height,
               row * this.cell_width,
               this.cell_height,
               this.cell_width
            );
         }
      }        
   }
   
   this.render_score = function() {
		
		this.score_card = document.getElementById('score_sheet'); 
		this.game_score = document.getElementById('score');
		
		var newdiv = document.createElement('div');
		var html = "<p id='score'>Score:" + this.score + "</p>";

		newdiv.setAttribute('id', 'score_sheet');
		newdiv.className = 'grid_4';
		newdiv.innerHTML = html;

		this.main_div.appendChild(newdiv);
		this.main_div.removeChild(this.score_card);
   }  
   
   this.game_tick = function() {

      this.move_down();
      this.clear_screen();
      this.render_score();
      this.render_board();     
      this.render_piece();

   }
  
   this.lose =  function () {
		alert("Lose!\nScore: " + this.score);    
      location.reload();
   }
}


function game () {
   
   var engine = new game_engine();
   engine.render_score();
   engine.render_board();
   engine.render_piece();
   engine.render_next_piece();
   
   setInterval(
      function () {
      	engine.game_tick();
      },
      1000
   );     

   document.onkeydown = function(event){
      event.preventDefault();
      switch(event.keyCode) {
         case engine.keys.left_: 
            engine.move_left();
            break;
         case engine.keys.right_: 
            engine.move_right();
            break;
         case engine.keys.down: 
            engine.move_down();
            break;
         case engine.keys.up:
            engine.rotate();
            break;
         case engine.keys.space : 
            engine.drop();
            break;
         case this.keys.ESC: 
            engine.lose();
            break;
         default:
            break;
      };
      engine.clear_screen();
      engine.render_score();
      engine.render_board();     
      engine.render_piece();
   }    
}

function main () {
   game();
}

main();

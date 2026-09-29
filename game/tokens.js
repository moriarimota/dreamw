/* Built-in board tokens: fixed artwork rather than platform emoji fonts. */
(function(root){'use strict';const shapes=[
 [['#e6bd56','M11 2H7V3H5V5H4V10H5V12H7V13H11V12H13V10H14V7H12V9H10V10H7V9H6V6H7V4H10V3H11Z']],
 [['#e7b95b','M8 1L10 5L15 6L11 10L12 15L8 12L4 15L5 10L1 6L6 5Z']],
 [['#b88060','M6 8H10V14H6Z'],['#c16655','M2 8V5H4V3H7V2H10V3H12V5H14V8Z'],['#fff0cf','M4 5H6V7H4ZM9 4H11V6H9Z']],
 [['#a7534b','M4 5H12V7H14V10H12V13H10V15H6V13H4V10H2V7H4Z'],['#6e8750','M4 2L7 3L8 1L10 3L13 2L11 6H5Z'],['#f6d381','M5 7H6V8H5ZM9 8H10V9H9ZM7 11H8V12H7Z']],
 [['#74915e','M7 14V8H3V6H2V3H5V4H7V7H9V4H11V2H14V6H12V8H9V14Z']],
 [['#d6a085','M2 11V6H3V4H6V2H10V3H13V5H14V11L9 14H7Z'],['#f9ddaf','M4 6H5V10H4ZM7 4H8V11H7ZM10 5H11V10H10Z']],
 [['#ad897a','M7 7L3 2L1 3V8L5 9L2 10V13L4 15L7 11ZM9 7L13 2L15 3V8L11 9L14 10V13L12 15L9 11Z'],['#655444','M7 5H9V13H7Z']],
 [['#9d8bae','M5 2H11V3H13V6H14V9H12V11H4V10H2V5H3V3H5Z'],['#dbd4da','M4 4H7V6H4Z'],['#987d58','M5 11H11V13H13V15H3V13H5Z']],
 [['#c5a05c','M2 3H7V4H9V7H14V10H12V9H10V11H8V8H6V9H2V8H1V4H2Z'],['#f6ecd7','M3 5H5V7H3Z']],
 [['#94b5af','M3 13V7H5V4H8V2H14V5H12V8H10V10H7V12H5V14H3Z'],['#e4dbbf','M3 14L12 5L11 4L2 13Z']],
 [['#d6a251','M7 1H9V3H7ZM7 13H9V15H7ZM1 7H3V9H1ZM13 7H15V9H13ZM3 3H5V5H3ZM11 3H13V5H11ZM3 11H5V13H3ZM11 11H13V13H11Z'],['#e9bd62','M5 5H11V11H5Z']],
 [['#be7f83','M2 3H6V4H8V5H9V4H11V3H14V4H15V8H13V10H11V12H9V14H7V12H5V10H3V8H1V4H2Z']]
 ];
 function icon(index){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 16 16');svg.setAttribute('class','board-token');svg.setAttribute('aria-hidden','true');svg.setAttribute('shape-rendering','crispEdges');for(const[color,d]of shapes[index]){const p=document.createElementNS(ns,'path');p.setAttribute('fill',color);p.setAttribute('d',d);svg.append(p);}return svg;}
 root.WitchTokens={icon};
})(globalThis);

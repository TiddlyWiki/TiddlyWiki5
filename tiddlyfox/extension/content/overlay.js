var TiddlyFox = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
  },

  onMenuItemCommand: function() {
    window.open("chrome://tiddlyfox/content/hello.xul", "", "chrome");
  }
};

window.addEventListener("load", function(e) { TiddlyFox.onLoad(e); }, false); 

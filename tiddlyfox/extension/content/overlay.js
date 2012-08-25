var HelloWorld = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
  },

  onMenuItemCommand: function() {
    window.open("chrome://helloworld/content/hello.xul", "", "chrome");
  }
};

window.addEventListener("load", function(e) { HelloWorld.onLoad(e); }, false); 

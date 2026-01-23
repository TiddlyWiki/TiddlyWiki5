/*\
title: $:/plugins/tiddlywiki/prosemirror/image/nodeview.js
type: application/javascript
module-type: library

Image node view for ProseMirror - MINIMAL TEST VERSION

\*/

"use strict";

class ImageNodeView {
	constructor(node, view, getPos, parentWidget) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;
		this.parentWidget = parentWidget;
		
		// Create the DOM structure
		const wrap = document.createElement("span");
		wrap.className = "pm-image-nodeview";
		
		const header = document.createElement("span");
		header.className = "pm-image-nodeview-header";
		
		const title = document.createElement("span");
		title.className = "pm-image-nodeview-title";
		title.textContent = node.attrs.twSource || "Image";
		
		const buttons = document.createElement("span");
		buttons.className = "pm-image-nodeview-buttons";
		
		const editBtn = document.createElement("button");
		editBtn.className = "pm-image-nodeview-btn pm-image-nodeview-edit";
		editBtn.textContent = "Edit";
		editBtn.type = "button";
		
		const self = this;
		editBtn.addEventListener("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
			console.log("[ImageNodeView] Edit button clicked!");
			self.toggleEdit();
			return false;
		}, true);
		
		buttons.appendChild(editBtn);
		header.appendChild(title);
		header.appendChild(buttons);
		
		const content = document.createElement("div");
		content.className = "pm-image-nodeview-content";
		
		const img = document.createElement("img");
		img.className = "pm-image-nodeview-img";
		img.src = node.attrs.src || "";
		if(node.attrs.twSource) {
			img.setAttribute("data-tw-source", node.attrs.twSource);
		}
		
		content.appendChild(img);
		wrap.appendChild(header);
		wrap.appendChild(content);
		
		this.dom = wrap;
		this.img = img;
		this.header = header;
		this.editBtn = editBtn;
		this.content = content;
		this.isEditing = false;
		
		console.log("[ImageNodeView] Created, dom:", this.dom.outerHTML);
	}
	
	toggleEdit() {
		console.log("[ImageNodeView] toggleEdit called, isEditing:", this.isEditing);
		this.isEditing = !this.isEditing;
		
		if(this.isEditing) {
			// Show textarea
			this.content.innerHTML = "";
			this.content.appendChild(this.img);
			
			const textarea = document.createElement("textarea");
			textarea.className = "pm-image-nodeview-editor";
			textarea.value = "[img[" + (this.node.attrs.twSource || "") + "]]";
			textarea.rows = 2;
			this.content.appendChild(textarea);
			
			console.log("[ImageNodeView] Added textarea, content:", this.content.outerHTML);
		} else {
			// Hide textarea
			this.content.innerHTML = "";
			this.content.appendChild(this.img);
		}
	}
	
	selectNode() {
		this.dom.classList.add("selected");
	}
	
	deselectNode() {
		this.dom.classList.remove("selected");
	}
	
	update(node) {
		if(node.type !== this.node.type) {
			return false;
		}
		this.node = node;
		return true;
	}
	
	destroy() {
		// Cleanup
	}
}

exports.ImageNodeView = ImageNodeView;

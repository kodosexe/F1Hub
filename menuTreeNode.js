class menuTreeNode {
    /*
     * Types: "mainpage", "event", "stream", "live", "eventCategory"
    */
    constructor(id, parent, displayName, type, playable, targetUrl) {
        this.children = [];
        this.id = id;
        this.parent = parent;
        this.displayName = displayName;
        this.type = type;
        this.playable = playable;
        this.targetUrl = targetUrl;
    }

    appendChild(id) {
        this.children.push(id);
    }
}


module.exports = menuTreeNode;
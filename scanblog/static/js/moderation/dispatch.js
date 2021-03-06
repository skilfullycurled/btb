(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  btb.ScanModerationRouter = (function(_super) {

    __extends(ScanModerationRouter, _super);

    function ScanModerationRouter() {
      this.updateActiveURL = __bind(this.updateActiveURL, this);
      this.mail = __bind(this.mail, this);
      this.processDocument = __bind(this.processDocument, this);
      this.processScan = __bind(this.processScan, this);
      this.processScanList = __bind(this.processScanList, this);
      this.users = __bind(this.users, this);
      this.pending = __bind(this.pending, this);
      this.dashboard = __bind(this.dashboard, this);
      ScanModerationRouter.__super__.constructor.apply(this, arguments);
    }

    ScanModerationRouter.prototype.routes = {
      "": "dashboard",
      "/pending": "pending",
      "/users": "users",
      "/users/:id": "users",
      "/process": "processScanList",
      "/process/scan/:id": "processScan",
      "/process/document/:idlist": "processDocument",
      "/mail": "mail",
      "/mail/:path": "mail"
    };

    ScanModerationRouter.prototype.dashboard = function() {
      $("#app").html(new btb.Dashboard().render().el);
      return this.updateActiveURL();
    };

    ScanModerationRouter.prototype.pending = function() {
      $("#app").html(new btb.PendingScans().render().el);
      return this.updateActiveURL();
    };

    ScanModerationRouter.prototype.users = function(userId) {
      $("#app").html(new btb.UserDetail({
        userId: userId
      }).render().el);
      return this.updateActiveURL();
    };

    ScanModerationRouter.prototype.processScanList = function() {
      $("#app").html(new btb.ProcessingManager().render().el);
      return this.updateActiveURL();
    };

    ScanModerationRouter.prototype.processScan = function(scanId) {
      $("#app").html(new btb.SplitScanView(scanId).render().el);
      return this.updateActiveURL();
    };

    ScanModerationRouter.prototype.processDocument = function(idlist) {
      $("#app").html(new btb.EditDocumentManager({
        documents: idlist.split(".")
      }).render().el);
      return this.updateActiveURL();
    };

    ScanModerationRouter.prototype.mail = function(path) {
      $("#app").html(new btb.OutgoingMailView(path).render().el);
      return this.updateActiveURL();
    };

    ScanModerationRouter.prototype.updateActiveURL = function() {
      var path_stub;
      path_stub = window.location.hash.split("/").slice(0, 2).join("/");
      $("#subnav a").removeClass("active");
      if (path_stub === "") path_stub = "#";
      return $('#subnav a[href="' + path_stub + '"]').addClass("active");
    };

    return ScanModerationRouter;

  })(Backbone.Router);

  btb.app = new btb.ScanModerationRouter();

  Backbone.history.start();

}).call(this);

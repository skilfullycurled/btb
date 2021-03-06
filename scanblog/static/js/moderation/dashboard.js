(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  btb.Dashboard = (function(_super) {

    __extends(Dashboard, _super);

    function Dashboard() {
      this.changeScans = __bind(this.changeScans, this);
      this.changeDocs = __bind(this.changeDocs, this);
      this.render = __bind(this.render, this);
      Dashboard.__super__.constructor.apply(this, arguments);
    }

    Dashboard.prototype.template = _.template($("#dashboard").html());

    Dashboard.prototype.events = {
      "click .doc-chooser span": "changeDocs",
      "click .scan-chooser span": "changeScans"
    };

    Dashboard.prototype.initialize = function() {
      this.docsView = new btb.ProcessDocListView();
      this.lettersView = new btb.DashboardNeededLettersView();
      this.scansView = new btb.ProcessScanListView();
      return this.ticketsView = new btb.NoteManager({
        filter: {
          unresolved: 1,
          sort: "-important,created"
        },
        addable: false
      });
    };

    Dashboard.prototype.render = function() {
      $(this.el).html(this.template());
      $(".open-tickets", this.el).html(this.ticketsView.el);
      $(".outgoing-mail", this.el).html(this.lettersView.render().el);
      $(".open-scans", this.el).html(this.scansView.render().el);
      $(".open-documents", this.el).html(this.docsView.render().el);
      $(".doc-chooser span[data-status=" + this.docsView.list.filter.status + "]", this.el).addClass("chosen");
      $(".scan-chooser span[data-complete=" + this.scansView.list.filter.processing_complete + "]", this.el).addClass("chosen");
      return this;
    };

    Dashboard.prototype.changeDocs = function(event) {
      $(".doc-chooser span", this.el).removeClass("chosen");
      $(event.currentTarget).addClass("chosen");
      this.docsView.list.filter.status = $(event.currentTarget).attr("data-status");
      return this.docsView.fetch();
    };

    Dashboard.prototype.changeScans = function(event) {
      $(".scan-chooser span", this.el).removeClass("chosen");
      $(event.currentTarget).addClass("chosen");
      this.scansView.list.filter.processing_complete = $(event.currentTarget).attr("data-complete");
      return this.scansView.fetch();
    };

    return Dashboard;

  })(Backbone.View);

  btb.DashboardNeededLettersView = (function(_super) {

    __extends(DashboardNeededLettersView, _super);

    function DashboardNeededLettersView() {
      this.render = __bind(this.render, this);
      DashboardNeededLettersView.__super__.constructor.apply(this, arguments);
    }

    DashboardNeededLettersView.prototype.template = _.template($("#dashboardLetters").html());

    DashboardNeededLettersView.prototype.itemTemplate = _.template($("#dashboardLettersItem").html());

    DashboardNeededLettersView.prototype.initialize = function() {
      var _this = this;
      this.needed = new btb.NeededLetters();
      this.queued = new btb.LetterList;
      this.queued.filter = {
        page: 1,
        per_page: 1,
        unsent: 1
      };
      this.queued.fetch({
        success: function() {
          return _this.render();
        },
        error: function() {
          return alert("Server Error: Queued Letters");
        }
      });
      return this.needed.fetch({
        success: function() {
          return _this.render();
        },
        error: function() {
          return alert("Server Error: NeededLetters");
        }
      });
    };

    DashboardNeededLettersView.prototype.render = function() {
      var count, type, _ref;
      $(this.el).html(this.template({
        enqueuedCount: this.queued.pagination.count
      }));
      _ref = this.needed.toJSON();
      for (type in _ref) {
        count = _ref[type];
        if (count > 0) {
          $(".needed-list", this.el).append(this.itemTemplate({
            type: type.split("_").join(" "),
            count: count
          }));
        }
      }
      return this;
    };

    return DashboardNeededLettersView;

  })(Backbone.View);

}).call(this);

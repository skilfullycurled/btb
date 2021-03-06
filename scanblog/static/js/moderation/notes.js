(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  btb.Note = (function(_super) {

    __extends(Note, _super);

    function Note() {
      this.url = __bind(this.url, this);
      Note.__super__.constructor.apply(this, arguments);
    }

    Note.prototype.url = function() {
      var baseUrl;
      baseUrl = btb.NoteList.prototype.baseUrl;
      if (this.get("id")) {
        return baseUrl + "/" + this.get("id");
      } else {
        return baseUrl;
      }
    };

    return Note;

  })(Backbone.Model);

  btb.NoteList = (function(_super) {

    __extends(NoteList, _super);

    function NoteList() {
      NoteList.__super__.constructor.apply(this, arguments);
    }

    NoteList.prototype.model = btb.Note;

    NoteList.prototype.baseUrl = "/annotations/notes.json";

    return NoteList;

  })(btb.FilteredPaginatedCollection);

  btb.NoteView = (function(_super) {

    __extends(NoteView, _super);

    function NoteView() {
      this.markResolved = __bind(this.markResolved, this);
      this.editNote = __bind(this.editNote, this);
      this.deleteNote = __bind(this.deleteNote, this);
      this.render = __bind(this.render, this);
      NoteView.__super__.constructor.apply(this, arguments);
    }

    NoteView.prototype.template = _.template($("#noteRow").html());

    NoteView.prototype.events = {
      'click .delete-note': 'deleteNote',
      'click .edit-note': 'editNote',
      'click .mark-resolved': 'markResolved'
    };

    NoteView.prototype.initialize = function(note) {
      return this.note = note;
    };

    NoteView.prototype.render = function() {
      $(this.el).html(this.template({
        note: this.note != null ? this.note.toJSON() : {}
      }));
      return this;
    };

    NoteView.prototype.deleteNote = function(event) {
      var _this = this;
      if (confirm("Really delete this note?  There's no undo.")) {
        $(".loading", this.el).show();
        return this.note.destroy({
          success: function() {
            $(".loading", _this.el).hide();
            return _this.trigger("noteDeleted", _this.note);
          }
        });
      }
    };

    NoteView.prototype.editNote = function(event) {
      return this.trigger("editNote", this.note);
    };

    NoteView.prototype.markResolved = function(event) {
      var _this = this;
      $(".loading", this.el).show();
      return this.note.save({
        "resolved": 1
      }, {
        success: function(model) {
          $(".loading", _this.el).hide();
          return _this.render();
        },
        error: function() {
          $(".loading", _this.el).hide();
          return alert("Server error -- changes not saved");
        }
      });
    };

    return NoteView;

  })(Backbone.View);

  btb.NoteViewTable = (function(_super) {

    __extends(NoteViewTable, _super);

    function NoteViewTable() {
      this.fetchItems = __bind(this.fetchItems, this);
      this.turnPage = __bind(this.turnPage, this);
      this.render = __bind(this.render, this);
      NoteViewTable.__super__.constructor.apply(this, arguments);
    }

    NoteViewTable.prototype.events = {
      'click span.pagelink': 'turnPage'
    };

    NoteViewTable.prototype.initialize = function(options) {
      var _base;
      if (options == null) {
        options = {
          filter: {}
        };
      }
      this.collection = new btb.NoteList;
      this.collection.filter = options.filter;
      (_base = this.collection.filter).per_page || (_base.per_page = 5);
      this.fetchItems();
      return $(this.el).addClass("note-table");
    };

    NoteViewTable.prototype.render = function() {
      var model, pag, view, _i, _len, _ref,
        _this = this;
      $(this.el).html("");
      _ref = this.collection.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        model = _ref[_i];
        view = new btb.NoteView(model);
        view.bind("editNote", function(note) {
          return _this.trigger("editNote", note);
        });
        view.bind("noteDeleted", function(note) {
          return _this.fetchItems();
        });
        $(this.el).append(view.render().el);
      }
      pag = $("<div class='pagination'></div>");
      $(this.el).append(pag);
      this.renderPagination(this.collection, pag);
      $(".note-obj-link", this.el).each(function(i, link) {
        if ($(link).attr("href") === window.location.pathname + window.location.hash) {
          return $(link).remove();
        }
      });
      return this;
    };

    NoteViewTable.prototype.turnPage = function(event) {
      this.collection.filter.page = this.newPageFromEvent(event);
      return this.fetchItems();
    };

    NoteViewTable.prototype.fetchItems = function() {
      var _this = this;
      $(this.el).addClass("loading");
      this.setPageLoading();
      return this.collection.fetch({
        success: function() {
          $(_this.el).removeClass("loading");
          return _this.render();
        },
        error: function() {
          $(_this.el).removeClass("loading");
          return alert("Server error");
        }
      });
    };

    return NoteViewTable;

  })(btb.PaginatedView);

  btb.NoteEditor = (function(_super) {

    __extends(NoteEditor, _super);

    function NoteEditor() {
      this.startEditing = __bind(this.startEditing, this);
      this.saveNote = __bind(this.saveNote, this);
      this.cancel = __bind(this.cancel, this);
      this.addNote = __bind(this.addNote, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      NoteEditor.__super__.constructor.apply(this, arguments);
    }

    NoteEditor.prototype.template = _.template($("#noteEditor").html());

    NoteEditor.prototype.events = {
      'click .add-note': 'addNote',
      'click .save-note': 'saveNote',
      'click .cancel-add': 'cancel'
    };

    NoteEditor.prototype.initialize = function(options) {
      if (options == null) {
        options = {
          defaults: {}
        };
      }
      this.defaults = options.defaults;
      return this.addable = (!(options.addable != null)) || options.addable;
    };

    NoteEditor.prototype.render = function() {
      return $(this.el).html(this.template({
        note: this.note != null ? this.note.toJSON() : null,
        addable: this.addable
      }));
    };

    NoteEditor.prototype.addNote = function(event) {
      this.note = new btb.Note(this.defaults);
      return this.render();
    };

    NoteEditor.prototype.cancel = function(event) {
      this.note = null;
      return this.render();
    };

    NoteEditor.prototype.saveNote = function(event) {
      var resolved,
        _this = this;
      $(".loading", this.el).show();
      if ($("input[name=needsResolution]", this.el).is(":checked")) {
        resolved = null;
      } else {
        resolved = true;
      }
      return this.note.save({
        text: $("textarea[name=text]", this.el).val(),
        important: $("input[name=important]", this.el).is(":checked"),
        resolved: resolved
      }, {
        success: function(model) {
          $(".loading", _this.el).hide();
          _this.trigger("noteAdded", model);
          return _this.cancel();
        },
        error: function(model) {
          alert("Server error");
          return $(".loading", _this.el).hide();
        }
      });
    };

    NoteEditor.prototype.startEditing = function(note) {
      this.note = note;
      return this.render();
    };

    return NoteEditor;

  })(Backbone.View);

  btb.NoteManager = (function(_super) {

    __extends(NoteManager, _super);

    function NoteManager() {
      this.render = __bind(this.render, this);
      NoteManager.__super__.constructor.apply(this, arguments);
    }

    NoteManager.prototype.initialize = function(options) {
      var _this = this;
      if (options == null) options = {};
      this.table = new btb.NoteViewTable(options);
      this.editor = new btb.NoteEditor(options);
      this.render();
      $(this.el).html(this.editor.el);
      $(this.el).append(this.table.el);
      this.editor.bind("noteAdded", function(note) {
        return _this.table.fetchItems();
      });
      return this.table.bind("editNote", function(note) {
        return _this.editor.startEditing(note);
      });
    };

    NoteManager.prototype.render = function() {
      this.editor.render();
      this.table.render();
      return this;
    };

    return NoteManager;

  })(Backbone.View);

}).call(this);

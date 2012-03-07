//
//     Copyright (C) 2012 Xavier Antoviaque <xavier@antoviaque.org>
//
//     This program is free software: you can redistribute it and/or modify
//     it under the terms of the GNU General Public License as published by
//     the Free Software Foundation, either version 3 of the License, or
//     (at your option) any later version.
//
//     This program is distributed in the hope that it will be useful,
//     but WITHOUT ANY WARRANTY; without even the implied warranty of
//     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//     GNU General Public License for more details.
//
//     You should have received a copy of the GNU General Public License
//     along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

(function($) {

    $.mok = {}
    
    // Models //////////////////////////////////////////////////////////////
        
    $.mok.Monster = Backbone.RelationalModel.extend({
        urlRoot: '/api/monster',
        idAttribute: '_id',
        relations: [{
            type: Backbone.HasMany,
            key: 'ownerships',
            relatedModel: '$.mok.Ownership',
            collectionType: '$.mok.OwnershipCollection',
            reverseRelation: {
                key: 'monster',
                includeInJSON: '_id',
            },
        }]
    });
    
    $.mok.Ownership = Backbone.RelationalModel.extend({
        urlRoot: '/api/ownership',
        idAttribute: '_id',
    });
    
    $.mok.OwnershipCollection = Backbone.Collection.extend({
        model: $.mok.Ownership,
        url: function(models) {
            return '/api/ownership' + (models ? '/set/' + _.pluck(models, '_id').join(';') : '');
        }
    });
    
    
    // Views ///////////////////////////////////////////////////////////////
    
    // Enter code //
    
    $.mok.EnterCodeView = Backbone.View.extend({
        tagName: "div",

        className: "mok_enter_code_view",
        
        initialize: function(){
            _.bindAll(this, 'render', 'on_keypress', 'on_submit');
        },
    
        template: Handlebars.compile($('#mok_tpl_enter_code').html()),
    
        render: function() {
            return $(this.el).html(this.template());
        },
        
        events: {
            'keypress .mok_code_field': 'on_keypress'
        },
        
        on_keypress: function(e) {
            if(e.keyCode === 13) {
                this.on_submit(e);
            }
        },
        
        on_submit: function(e) {
            var monster = new $.mok.Monster();
            monster.fetch({
                data: {code: this.$('input.mok_code_field').val()},
                success: function(model, response) {
                    $.mok.app.navigate('monster/'+monster.get('_id')+'/');
                    $.mok.app.monster(monster.get('_id'), monster);
                },
                error: function(model, response) {
                    var error = $.parseJSON(response.responseText);
                    this.$('.mok_error_message').html(error.message);
                }
            }); 
        },
    });
    
    // Monster //
    
    $.mok.MonsterView = Backbone.View.extend({
        tagName: "div",

        className: "mok_monster_view",
        
        initialize: function(){
            _.bindAll(this, 'render', 'render_ownership');
            this.model.bind('change', this.render);
            this.model.bind('add:ownerships', this.render_ownership); 
        },
    
        template: Handlebars.compile($('#mok_tpl_monster').html()),
        
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            
            // New ownership
            var new_ownership_view = new $.mok.NewOwnershipView({monster: this.model});
            this.$('ul.mok_ownership_list').append($(new_ownership_view.render()));
        },
        
        render_ownership: function(ownership) {
            var ownership_view = new $.mok.OwnershipView({model: ownership});
            this.$('ul.mok_ownership_list').prepend($(ownership_view.render()));
        },
    });
    
    // Ownership //
    
    $.mok.OwnershipView = Backbone.View.extend({
        tagName: "li",

        className: "mok_ownership_view",
        
        initialize: function(){
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
        },
    
        template: Handlebars.compile($('#mok_tpl_ownership').html()),
        
        render: function() {
            return $(this.el).html(this.template(this.model.toJSON()));
        },
    });
    
    $.mok.NewOwnershipView = Backbone.View.extend({
        tagName: "li",

        className: "mok_new_ownership_view",

        initialize: function(){
            _.bindAll(this, 'render', 'on_keypress', 'on_submit');
            this.monster = this.options.monster;
        },
    
        template: Handlebars.compile($('#mok_tpl_new_ownership').html()),
        
        render: function() {
            return $(this.el).html(this.template());
        },
        
        events: {
            'keypress input[type=text]': 'on_keypress',
            'click input[type=submit]': 'on_submit',
        },
        
        on_keypress: function(e) {
            if(e.keyCode === 13) {
                this.on_submit(e);
            }
        },
        
        on_submit: function(e) {
            var new_ownership = new $.mok.Ownership({address: this.$('.mok_location').val(),
                                                      deed: this.$('.mok_deed').val(),
                                                      monster: this.monster});
            new_ownership.save();
        },
    });
    
    
    // Router ///////////////////////////////////////////////////////////////
    
    $.mok.Router = Backbone.Router.extend({
        routes: {
            "": "enter_code",
            "monster/:_id/": "monster",
        },
    
        enter_code: function() {
            var enter_code_view = new $.mok.EnterCodeView({el: $('#content')});
            enter_code_view.render();
        },
        
        monster: function(_id, monster) {
            if(!monster) {
                monster = new $.mok.Monster({_id: _id});
                monster.fetch();
            }
            var monster_view = new $.mok.MonsterView({el: $('#content'),
                                                       model: monster});
        },
        
    });
    
    
    // App /////////////////////////////////////////////////////////////////
    
    $.mok.app = null;
    
    $.mok.bootstrap = function() {
        $.mok.app = new $.mok.Router(); 
        Backbone.history.start({pushState: true});
    };

})(jQuery);


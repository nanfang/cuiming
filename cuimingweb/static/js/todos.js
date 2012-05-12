$(function () {
    window.Todo = Backbone.Model.extend({
        defaults:function () {
            return {
                done:false,
                order:Todos.nextOrder(),
                schedule:null
            };
        },
        toggle:function () {
            this.save({done:!this.get("done")});
        },
        doIt:function(){
            var newTodo = {id:this.get('id'), text:this.get('text'), schedule:null};
            this.destroy();
            Todos.create(newTodo);
        }
    });

    window.TodoList = Backbone.Collection.extend({
        model:Todo,
        done:function () {
            return this.filter(function (todo) {
                return todo.get('done');
            });
        },
        remaining:function () {
            return this.without.apply(this, this.done());
        },
        nextOrder:function () {
            if (!this.length) return 1;
            return this.last().get('order') + 1;
        },
        comparator:function (todo) {
            return todo.get("schedule") || todo.get('order');
        }
    });

    window.Todos = new TodoList;
    Todos.localStorage = new Store("todos");
    window.Waits = new TodoList;
    Waits.localStorage = new Store("waits");

    window.TodoView = Backbone.View.extend({
        tagName:"li",
        template:_.template($('#item-template').html()),
        events:{
            "click .check":"toggleDone",
            "dblclick div.todo-text":"edit",
            "click li.todo-destroy":"clear",
            "click li.defer":"defer",
            "click li.do-it":"doit",
            "click li .schedule":"schedule",
            "keypress .todo-input":"updateOnEnter"
        },
        initialize:function () {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
        },
        render:function () {
            $(this.el).html(this.template(this.model.toJSON()));
            var me = this;
            me.setText();
            me.$('.schedule-picker').datetimepicker({
                onClose:function (dateText, inst) {
                    me.scheduleDone();
                },
                onSelect:function (dateText, inst) {
                    me.model.schedule=moment(dateText, "MM/DD/YYYY hh:mm:ss").valueOf();

                }
            });
            return me;
        },
        scheduleDone:function () {
            if((this.model.schedule - moment().valueOf()) > 5 * 60 * 1000){
                this.scheduleAt(this.model.schedule);
            }
        },
        setText:function () {
            var text = this.model.get('text');
            this.$('.todo-text').text(text);
            if (this.$('.todo-schedule') && this.model.get('schedule')) {
                this.$('.todo-schedule .time').text(moment(this.model.get('schedule')).format('hh:mm MMM DD'));
            }
            this.input = this.$('.todo-input');
            this.input.bind('blur', _.bind(this.close, this)).val(text);
        },
        toggleDone:function () {
            this.model.toggle();
        },
        edit:function () {
            $(this.el).addClass("editing");
            this.input.focus();
        },
        close:function () {
            this.model.save({text:this.input.val()});
            $(this.el).removeClass("editing");
        },
        updateOnEnter:function (e) {
            if (e.keyCode == 13) this.close();
        },
        remove:function () {
            $(this.el).remove();
        },
        clear:function () {
            this.model.destroy();
        },
        defer:function (e) {
            var deferHours = parseInt($(e.target).data('hours'));
            this.scheduleAt(moment().add('h', deferHours).valueOf());
        },
        scheduleAt:function(timestamp){
            this.model.destroy();
            Waits.create({id:this.model.get('id'), text:this.model.get('text'), schedule:timestamp});
        },
        doit:function (e) {
            this.model.doIt();
        },
        schedule:function () {
            this.$('.schedule-picker').focus();
        }
    });

    window.WaitView = TodoView.extend({
        template:_.template($('#wait-item-template').html())

    });

    window.AppView = Backbone.View.extend({
        el:$("#todoapp"),
        statsTemplate:_.template($('#stats-template').html()),
        events:{
            "keypress #new-todo":"createOnEnter",
            "keyup #new-todo":"showTooltip",
            "click .todo-clear a":"clearCompleted"
        },
        initialize:function () {
            this.input = this.$("#new-todo");
            Todos.bind('add', this.addTodo, this);
            Todos.bind('reset', this.addAll, this);
            Todos.bind('all', this.render, this);

            Waits.bind('add', this.refreshWaits, this);
            Waits.bind('reset', this.addAllWaits, this);
            Waits.bind('all', this.render, this);

            Todos.fetch();
            Waits.fetch();

            setInterval(function() {
                Waits.each(function(wait){
                    var currentTimestamp = moment().valueOf();
                    if((wait.get('schedule') - currentTimestamp) < 60*1000){
                        wait.doIt();
                    }
                });
            }, 60000);
        },
        render:function () {
            this.$('#todo-stats').html(this.statsTemplate({
                total:Todos.length,
                done:Todos.done().length,
                remaining:Todos.remaining().length,
                scheduled: Waits.remaining().length
            }));
        },
        addTodo:function (todo) {
            var view = new TodoView({model:todo});
            $("#todo-list").append(view.render().el);
        },
        addWait:function (todo) {
            var view = new WaitView({model:todo});
            $("#wait-list").append(view.render().el);
        },
        addAll:function () {
            Todos.each(this.addTodo);
        },
        refreshWaits:function () {
            $("#wait-list").empty();
            Waits.each(this.addWait);
        },
        addAllWaits:function () {
            Waits.each(this.addWait);
        },
        createOnEnter:function (e) {
            var text = this.input.val();
            if (!text || e.keyCode != 13) return;
            Todos.create({text:text});
            this.input.val('');
        },
        clearCompleted:function () {
            _.each(Todos.done(), function (todo) {
                todo.destroy();
            });
            return false;
        },
        showTooltip:function (e) {
            var tooltip = this.$(".ui-tooltip-top");
            var val = this.input.val();
            tooltip.fadeOut();
            if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
            if (val == '' || val == this.input.attr('placeholder')) return;
            var show = function () {
                tooltip.show().fadeIn();
            };
            this.tooltipTimeout = _.delay(show, 1000);
        }
    });


    window.App = new AppView;


});

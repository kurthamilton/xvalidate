'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var XValidate = window.XValidate || {};

(function ($, X) {
    var utils = {
        // adds or removes the class from the element based on the set value.
        setClass: function setClass($element, className, set) {
            return set === true ? $element.addClass(className) : $element.removeClass(className);
        }
    };

    var constants = {
        attr: {
            // An element within a form (see below) to be validated. Required. Set to a comma separated list of plugin names.
            // Add an accompanying plugin via XValidate.Plugins.add(options).
            plugins: 'data-xval-plugins',
            // A form to be validated. Required. Form elements will be validated on submit. Other elements will be validated on a descendant button click.
            form: 'data-xval-form',
            // The message displaying the validation message. Optional. Set to the name or id of the element.
            message: 'data-xval-message-for'
        },
        // CSS classes added by the validator. Can be used for styling
        classes: {
            message: 'validation-message',
            messageInvalid: 'validation-message--invalid',
            target: 'validation-target',
            targetInvalid: 'validation-target--invalid',
            // added to the target and message
            validating: 'x-validating'
        },
        // privately used data keys
        data: {
            invalidCount: '_xval-invalidCount',
            validating: '_xval-validating'
        },
        // The events triggered during validation.
        events: {
            // Triggered on the form when validation starts.
            validating: 'xval.validating',
            // Triggered on the form when validation ends.
            validated: 'xval.validated'
        }
    };

    var plugins = {};
    var Plugins = X.Plugins = {
        add: function add(options) {
            var defaults = {
                message: 'invalid',
                data: '{0}',
                callback: function callback(result) {
                    return result === true;
                }
            };

            options = $.extend(defaults, options);

            /* validate options */
            if (!options.name || !options.url) {
                console.log('plugin name or url not specified');
                return;
            }

            // check callback is a function
            if (typeof options.callback !== 'function') {
                console.log('callback is not a function');
                return;
            }

            // only allow alpha-numeric, underscore and hyphens in plugin names
            if (/[^\w|\-]+/.test(options.name)) {
                console.log('invalid plugin name \'' + options.name + '\'');
                return;
            }

            // enforce unique plugin names
            if (plugins.hasOwnProperty(options.name)) {
                console.log('plugin \'' + options.name + '\' has already been added');
                return;
            }

            plugins[options.name] = new Plugin(options);
        },
        addRange: function addRange(items) {
            $.each(items, function (key) {
                Plugins.add(items[key]);
            });
        },
        get: function get(name) {
            return plugins[name];
        }
    };

    var Form = function () {
        function Form($form) {
            _classCallCheck(this, Form);

            var self = this;

            /* set up targets and validations */
            var targets = [];
            var validations = [];

            // todo: handle dynamic forms
            // todo: handle nested forms
            var $targets = $('[' + constants.attr.plugins + ']', $form);
            $targets.each(function () {
                var target = new Target(self, $(this));
                targets.push(target);
                validations.push.apply(validations, _toConsumableArray(target.validations));
            });

            /* set up messages */
            // todo: move message to target. This would mean a selector per target, unless it is passed in to the constructor
            var messages = {};
            $('[' + constants.attr.message + ']', $form).each(function () {
                var message = $(this);
                message.addClass(constants.classes.message);
                var targetName = message.attr(constants.attr.message);
                messages[targetName] = message;
            });

            this.$form = $form;
            this.messages = messages;
            this.targets = targets;
            this.validations = validations;
        }

        _createClass(Form, [{
            key: 'clearMessages',
            value: function clearMessages() {
                $.each(this.messages, function (key, message) {
                    return message.html('').removeClass(constants.classes.messageInvalid);
                });
            }
        }, {
            key: 'messageFor',
            value: function messageFor(target) {
                return this.messages[target.name];
            }
        }, {
            key: 'onValidateRequired',
            value: function onValidateRequired(callback) {
                if (this.$form.is('form')) {
                    this.$form.on('submit', function (e) {
                        callback(e);
                        return false;
                    });
                    return;
                }
                $('button', this.$form).on('click', callback);
                return;
            }
        }, {
            key: 'onValidateStart',
            value: function onValidateStart() {
                this.trigger(constants.events.validating);
                this.validating = true;
                this.setChildrenValidating(true);
                this.clearMessages();
                this.invalidCount = 0;
            }
        }, {
            key: 'onValidateStop',
            value: function onValidateStop() {
                this.validating = false;
                this.setChildrenValidating(false);
                this.trigger(constants.events.validated);
            }
        }, {
            key: 'setChildrenValidating',
            value: function setChildrenValidating(value) {
                // update target validating values
                $.each(this.targets, function (i, target) {
                    target.validating = value;
                    return true; // to stay in loop
                });

                // add or remove validating css class on messages
                $.each(this.messages, function (key, message) {
                    return utils.setClass(message, constants.classes.validating, value);
                });
            }
        }, {
            key: 'trigger',
            value: function trigger(name) {
                this.$form.trigger(name);
            }
        }, {
            key: 'invalidCount',
            get: function get() {
                return this.$form.data(constants.data.invalidCount);
            },
            set: function set(value) {
                this.$form.data(constants.data.invalidCount, value);
            }
        }, {
            key: 'validating',
            get: function get() {
                return this.$form.data(constants.data.validating);
            },
            set: function set(value) {
                this.$form.data(constants.data.validating, value);
            }
        }]);

        return Form;
    }();

    var Plugin = function () {
        function Plugin(options) {
            _classCallCheck(this, Plugin);

            this.callback = options.callback;
            this.data = options.data;
            this.message = options.message;
            this.name = options.name;
            this.url = options.url;
        }

        _createClass(Plugin, [{
            key: 'isValid',
            value: function isValid(result) {
                return this.callback(result) === true;
            }
        }]);

        return Plugin;
    }();

    var Target = function () {
        function Target(form, $element) {
            var _this = this;

            _classCallCheck(this, Target);

            $element.addClass(constants.classes.target);

            /* set up validations */
            var validations = [];

            var pluginNames = $element.attr(constants.attr.plugins).split(',');
            $.each(pluginNames, function (i, pluginName) {
                var plugin = Plugins.get(pluginName);
                if (plugin) {
                    validations.push(new Validation(_this, plugin));
                }
            });

            this.$element = $element;
            this.form = form;
            this.name = $element[0].name;
            this.validations = validations;
        }

        _createClass(Target, [{
            key: 'showError',
            value: function showError(messageText) {
                this.$element.addClass(constants.classes.targetInvalid);
                var message = this.form.messageFor(this);
                message.html(message.html() + messageText + ' ').addClass(constants.classes.messageInvalid);
            }
        }, {
            key: 'validating',
            set: function set(value) {
                if (value === true) {
                    this.$element.removeClass(constants.classes.targetInvalid);
                }
                utils.setClass(this.$element, constants.classes.validating, value);
            }
        }]);

        return Target;
    }();

    var Validation = function () {
        function Validation(target, plugin) {
            _classCallCheck(this, Validation);

            this.plugin = plugin;
            this.target = target;
        }

        _createClass(Validation, [{
            key: 'createRequest',
            value: function createRequest() {
                return $.ajax({
                    url: this.plugin.url,
                    data: this.data()
                });
            }
        }, {
            key: 'data',
            value: function data() {
                // todo: bind plugin.data to form
                return { key: 1 };
            }
        }, {
            key: 'message',
            value: function message() {
                // todo: bind plugin.message to form
                return this.plugin.message;
            }
        }, {
            key: 'validate',
            value: function validate(result) {
                var isValid = this.plugin.isValid(result);
                if (isValid === false) {
                    this.target.form.invalidCount++;
                    this.target.showError(this.message());
                }
            }
        }]);

        return Validation;
    }();

    var Validator = function () {
        function Validator($form) {
            var _this2 = this;

            _classCallCheck(this, Validator);

            var form = new Form($form);
            form.onValidateRequired(function () {
                return _this2.validate();
            });

            this.form = form;
        }

        _createClass(Validator, [{
            key: 'onFail',
            value: function onFail(reason) {
                console.log('an error has occurred:');
                console.log(reason);
            }
        }, {
            key: 'onFulfilled',
            value: function onFulfilled(results) {
                var _this3 = this;

                $.each(results, function (i, result) {
                    return _this3.form.validations[i].validate(result);
                });
            }
        }, {
            key: 'validate',
            value: function validate() {
                var _this4 = this;

                if (this.form.validating === true) {
                    return;
                }

                this.form.onValidateStart();

                var requests = $.map(this.form.validations, function (validation) {
                    return validation.createRequest();
                });

                Promise.all(requests).then(function (results) {
                    return _this4.onFulfilled(results);
                }, this.onFail).catch(this.onFail).then(function () {
                    return _this4.form.onValidateStop();
                });
            }
        }]);

        return Validator;
    }();

    // jQuery plugin


    var validators = [];
    $.fn.xvalidate = function (options) {
        return this.each(function (i, form) {
            return validators.push(new Validator($(form)));
        });
    };

    return X;
})(jQuery, XValidate);

// invoke default implementation
$(function () {
    $('[data-xval-form]').xvalidate();
});
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var XValidate = window.XValidate || {};

(function ($, X) {
    var utils = {
        // adds or removes the class from the element based on the set value.
        class: function _class($element, className, set) {
            return set === true ? $element.addClass(className) : $element.removeClass(className);
        },
        // Gets or sets data associated with the element. Gets data if value is undefined, else sets data.
        data: function data($element, key, value) {
            if (value === undefined) {
                return $element.data(key);
            }
            return $element.data(key, value);
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
            validating: '_xval-validating',
            valid: '_xval-valid'
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

            this.$form = $form;
            /* set up targets and validations */

            var targets = this.targets = {};
            var validations = this.validations = [];

            // todo: handle dynamic forms
            // todo: handle forms within forms
            var $targets = $('[' + constants.attr.plugins + ']', $form);
            $targets.each(function () {
                var target = new Target(self, $(this));
                targets[target.name] = target;
                validations.push.apply(validations, _toConsumableArray(target.validations));
            });

            /* set up messages */
            // todo: move message to target. This would mean a selector per target, unless it is passed in to the constructor
            var messages = this.messages = {};
            $('[' + constants.attr.message + ']', $form).each(function () {
                var message = $(this);
                message.addClass(constants.classes.message);
                var targetName = message.attr(constants.attr.message);
                messages[targetName] = message;
            });
        }

        _createClass(Form, [{
            key: 'hideMessages',
            value: function hideMessages() {
                $.each(this.messages, function (key, message) {
                    message.html('').removeClass(constants.classes.messageInvalid);
                });
            }
        }, {
            key: 'invalidCount',
            value: function invalidCount(value) {
                return utils.data(this.$form, constants.data.invalidCount, value);
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
            key: 'showError',
            value: function showError(target, messageText) {
                var message = this.messageFor(target);
                message.html(message.html() + messageText + ' ').addClass(constants.classes.messageInvalid);
            }
        }, {
            key: 'trigger',
            value: function trigger(name) {
                this.$form.trigger(name);
            }

            /** Gets or sets a value indicating the form is validating. */

        }, {
            key: 'validating',
            value: function validating(isValidating) {
                // update targets and messages if setting a value
                if (isValidating !== undefined) {
                    // hide messages if validating
                    if (isValidating === true) {
                        this.hideMessages();
                    }

                    // set or remove validating css class on targets and messages
                    $.each(this.targets, function (key, target) {
                        return target.validating(isValidating);
                    });
                    $.each(this.messages, function (key, message) {
                        return utils.class(message, constants.classes.validating, isValidating);
                    });
                }

                // set data on form
                return utils.data(this.$form, constants.data.validating, isValidating);
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

            /* set up validations */
            var pluginNameString = $element.attr(constants.attr.plugins);
            if (!pluginNameString) {
                return;
            }

            $element.addClass(constants.classes.target);

            var pluginNames = pluginNameString.split(',');
            var validations = this.validations = [];
            $.each(pluginNames, function (i, pluginName) {
                var plugin = Plugins.get(pluginName);
                if (plugin) {
                    var validation = new Validation(_this, plugin);
                    validations.push(validation);
                }
            });

            this.$element = $element;
            this.form = form;
            this.name = $element[0].name;
        }

        _createClass(Target, [{
            key: 'valid',
            value: function valid(isValid, message) {
                if (isValid === false) {
                    this.form.invalidCount(this.form.invalidCount() + 1);
                    this.form.showError(this, message);
                    this.$element.addClass(constants.classes.targetInvalid);
                }
                return utils.data(this.$element, constants.data.valid, isValid);
            }
        }, {
            key: 'validating',
            value: function validating(isValidating) {
                if (isValidating === true) {
                    this.$element.removeClass(constants.classes.targetInvalid);
                }
                utils.class(this.$element, constants.classes.validating, isValidating);
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
                this.target.valid(isValid, this.message());
            }
        }]);

        return Validation;
    }();

    var Validator = function () {
        function Validator($form) {
            var _this2 = this;

            _classCallCheck(this, Validator);

            var form = this.form = new Form($form);
            form.onValidateRequired(function () {
                return _this2.validate();
            });
        }

        _createClass(Validator, [{
            key: 'onFail',
            value: function onFail(reason) {
                console.log('an error has occurred:');
                console.log(reason);
            }
        }, {
            key: 'onFulfilled',
            value: function onFulfilled(validations, results) {
                var _this3 = this;

                $.each(results, function (i, result) {
                    _this3.form.validations[i].validate(result);
                });
            }
        }, {
            key: 'start',
            value: function start() {
                this.form.trigger(constants.events.validating);
                this.form.validating(true);
                this.form.invalidCount(0);
            }
        }, {
            key: 'stop',
            value: function stop() {
                this.form.validating(false);
                this.form.trigger(constants.events.validated);
            }
        }, {
            key: 'validate',
            value: function validate() {
                var _this4 = this;

                if (this.form.validating() === true) {
                    return;
                }

                this.start();

                var validations = this.form.validations;
                var requests = $.map(validations, function (validation) {
                    return validation.createRequest();
                });

                Promise.all(requests).then(function (results) {
                    return _this4.onFulfilled(validations, results);
                }, function (reason) {
                    return _this4.onFail(reason);
                }).catch(function (reason) {
                    return _this4.onFail(reason);
                }).then(function () {
                    return _this4.stop();
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
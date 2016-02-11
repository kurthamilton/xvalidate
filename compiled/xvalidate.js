'use strict';

var XValidate = window.XValidate || {};

XValidate.Constants = function () {
    return {
        attr: { // The data-* attributes to set in the markup.
            data: 'xval-data', // The data to pass to the request. Optional. Key names must be quoted for JSON.parse. Fallback to an object like: { elementname: elementvalue }.
            element: 'xval', // An element within a form (see below) to be validated. Required.
            form: 'xval-form', // A form to be validated. Required. Will be validated on submit if a form, else by a button click if anything else.
            url: 'xval-url', // The url for the request. Required.
            message: 'xval-message-for' // The message displaying the validation message. Optional. Set to the name or id of the element.
        },
        classes: { // CSS classes added by the validator. Can be used for styling. Can be overwritten.
            messageValid: 'field-validation-valid',
            messageInvalid: 'field-validation-invalid field-validation-error',
            validating: 'x-validating'
        },
        dataAttr: { // The data-* attributes used to store status
            invalidCount: '_xval-invalidCount',
            validating: '_xval-validating',
            valid: '_xval-valid'
        },
        events: { // The events triggered during validation.
            validating: 'xval.validating', // Triggered on the form when validation starts.
            validated: 'xval.validated' // Triggered on the form when validation ends.
        }
    };
};

XValidate.Form = class Form {
    constructor($form) {
        this.$form = $form;
    }

    static get attr() {
        return {
            message: 'xval-message-for'
        };
    }
    static get classes() {
        return {
            messageValid: 'field-validation-valid',
            messageInvalid: 'field-validation-invalid field-validation-error'
        };
    }
    static get dataAttr() {
        return {
            invalidCount: '_xval-invalidCount',
            validating: '_xval-validating'
        };
    }

    errorLabelFor(target) {
        return $('[data-' + this.attr.message + '="' + target.element()[0].name + '"]', this.$form);
    }

    hideErrors(target) {
        this.errorLabelFor(target).html('').removeClass(this.classes.messageInvalid).addClass(this.classes.messageValid);
    }

    invalidCount(value) {
        return this.$form.data(this.dataAttr.invalidCount, value);
    }

    onValidateRequired(callback) {
        if (this.$form.is('form')) {
            this.$form.on('submit', callback);
        }
        $('button', this.$form).on('click', callback);
    }

    showError(target) {
        this.errorLabelFor(target).html(this.errorLabelFor(target).html() + 'error message ').removeClass(this.classes.messageValid).addClass(this.classes.messageInvalid);
    }

    targets() {
        var elements = $('[data-' + this.attr.element + ']', this.$form);
        return $.map(elements, function (element) {
            return new XValidate.Target(self, $(element));
        });
    }

    trigger(name) {
        this.$form.trigger(name);
    }

    validating(value) {
        return this.$form.data(this.dataAttr.validating, value);
    }
};

XValidate.Target = class Target {
    constructor(form, $element) {
        this.form = form;
        this.$element = $element;
    }

    get attr() {
        return {
            data: 'xval-data',
            url: 'xval-url'
        };
    }

    get dataAttr() {
        return {
            valid: '_xval-valid'
        };
    }

    data() {
        return JSON.parse(this.dataTemplate().replace('{0}', this.$element.val()));
    }

    dataTemplate() {
        if (this.$element[0].hasAttribute('data-' + this.attr.data)) {
            return JSON.stringify(this.$element.data(this.attr.data));
        }
        return '{ "' + this.$element[0].name || this.$element[0].id + '":"{0}"}';
    }

    url() {
        return this.$element.data(this.attr.url);
    }

    valid(value) {
        if (value === false) {
            this.form.invalidCount(this.form.invalidCount() + 1);
            this.form.showError(self);
        }
        return this.$element.data(this.dataAttr.valid, value);
    }
};

XValidate.Validator = class Validator {
    constructor(form) {
        this.form = form;
    }

    static get events() {
        return {
            validating: 'xval.validating',
            validated: 'xval.validated'
        };
    }

    start() {
        this.form.trigger(this.events.validating);
        this.form.validating(true);
        this.form.invalidCount(0);
    }

    stop() {
        this.form.validating(false);
        this.form.trigger(this.events.validated);
    }

    validate() {
        if (this.form.validating() === true) {
            return;
        }

        this.start();

        let targets = this.form.targets();
        var requests = this.createRequests(targets);
        var promise = $.when.apply($, requests);
        promise.done(function () {
            var results = arguments;
            var resultCount = targets.length === 1 ? 1 : results.length;
            for (var i = 0; i < resultCount; i++) {
                var target = targets[i];
                // todo: handle multiple vals per target
                this.form.hideErrors(target);
                var result = targets.length === 1 ? results[0] : results[i][0];
                // todo: configure result eval. ***Plugin***
                var isValid = result === true;
                target.valid(isValid);
            }
        }).fail(function () {}).always(function () {
            this.stop();
        });
    }

    createRequests(targets) {
        return $.map(targets, function (target) {
            return $.ajax({
                url: target.url(),
                data: target.data()
            });
        });
    }
};

(function ($) {
    $.fn.xvalidate = function (options) {
        return this.each(function () {
            var form = new XValidate.Form($(this));
            var validator = new XValidate.Validator(form);
            form.onValidateRequired(validator.validate);
        });
    };
})(jQuery);

$(function () {
    /*default implementation*/
    var forms = $('[data-xval-form]').xvalidate();
    console.log(forms);
});
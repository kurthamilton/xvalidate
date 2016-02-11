'use strict';

var XValidate = window.XValidate || {};

XValidate.Constants = class Constants {
    static get attr() { 				// The data-* attributes to set in the markup.
        return { 
            data: 'xval-data',			// The data to pass to the request. Optional. Key names must be quoted for JSON.parse. Fallback to an object like: { elementname: elementvalue }.
            element: 'xval',			// An element within a form (see below) to be validated. Required.
            form: 'xval-form',			// A form to be validated. Required. Will be validated on submit if a form, else by a button click if anything else.
            url: 'xval-url',			// The url for the request. Required.
            message: 'xval-message-for'	// The message displaying the validation message. Optional. Set to the name or id of the element.
        };
    }
    static get classes() {              // CSS classes added by the validator. Can be used for styling. Can be overwritten.
        return { 
            messageValid: 'field-validation-valid',
            messageInvalid: 'field-validation-invalid field-validation-error',
            validating: 'x-validating'
        };
    }
    static get dataAttr() {             // The data-* attributes used to store status
        return { 
            invalidCount: '_xval-invalidCount',
            validating: '_xval-validating',
            valid: '_xval-valid'
        };
    }
    static get events() {               // The events triggered during validation.
        return {
            validating: 'xval.validating',	// Triggered on the form when validation starts.
            validated: 'xval.validated'		// Triggered on the form when validation ends.
        };
    }
}

XValidate.Utils = class Utils {
    // todo replace calls to $.data with Utils.data
    static data($element, attr, value) {
        if (value === undefined) {
            return $element.data(attr);
        }
        $element.data(attr, value);
    }
}

XValidate.Form = class Form {    
    constructor($form) {
        this.$form = $form;        
    }   
    
    errorLabelFor(target) {
        return $('[data-' + XValidate.Constants.attr.message + '="' + target.$element[0].name + '"]', this.$form);
    }
    
    hideErrors(target) {
        this.errorLabelFor(target)
            .html('')
            .removeClass(XValidate.Constants.classes.messageInvalid)
            .addClass(XValidate.Constants.classes.messageValid);
    }
    
    invalidCount(value) {
        return XValidate.Utils.data(this.$form, XValidate.Constants.dataAttr.invalidCount, value);
    }
    
    onValidateRequired(callback) {
        let run = e => callback.apply(this, e);
        
        if (this.$form.is('form')) {
            this.$form.on('submit', run);
            return;
        }
        $('button', this.$form).on('click', run);
        return;
    }
    
    showError(target) {
        this.errorLabelFor(target)
            .html(this.errorLabelFor(target).html() + 'error message ')
            .removeClass(XValidate.Constants.classes.messageValid)
            .addClass(XValidate.Constants.classes.messageInvalid);
    }
    
    targets() {
        let elements = $('[data-' + XValidate.Constants.attr.element + ']', this.$form);
        return $.map(elements, (element) => new XValidate.Target(this, $(element)));
    }
    
    trigger(name) {
        this.$form.trigger(name);
    }
    
    validating(value) {
        return this.$form.data(XValidate.Constants.dataAttr.validating, value);
    }
};

XValidate.Target = class Target {
    constructor(form, $element) {
        this.form = form;
        this.$element = $element; 
    }    
    
    data() {
        return JSON.parse(this.dataTemplate().replace('{0}', this.$element.val()));
    }
    
    dataTemplate() {
        if (this.$element[0].hasAttribute('data-' + XValidate.Constants.attr.data)) {
            return JSON.stringify(this.$element.data(XValidate.Constants.attr.data));
        }
        return '{ "' + this.$element[0].name || this.$element[0].id + '":"{0}"}';
    }
    
    url() {
        return this.$element.data(XValidate.Constants.attr.url);
    }
    
    valid(value) {
        if (value === false) {				
            this.form.invalidCount(this.form.invalidCount() + 1);
            this.form.showError(this);
        }
        return  this.$element.data(XValidate.Constants.dataAttr.valid, value);
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
        }
    }
    
    start() {
		this.form.trigger(XValidate.Constants.events.validating);
		this.form.validating(true);
		this.form.invalidCount(0);
	}
    
	stop() {
		this.form.validating(false);
		this.form.trigger(XValidate.Constants.events.validated);
	}
		
    validate() {
        if (this.form.validating() === true) {
            return;
        }
		
		this.start();
		
        let targets = this.form.targets();
        let requests = this.createRequests(targets);        
        let form = this.form;
        Promise.all(requests)
               .then((results) => {
                    for (let i = 0; i < results.length; i++) {
                        let target = targets[i];
                        // todo: handle multiple vals per target
                        form.hideErrors(target);
                        let result = results.length === 1 ? results[0] : results[i][0];
                        // todo: configure result eval. ***Plugin***
                        let isValid = result === true;
                        target.valid(isValid);
                    }                    
        });        
    }
    
    createRequest (target) {
        return $.ajax({
                url: target.url(),
                data: target.data()
            });
    }
    
    createRequests (targets) {         
        return $.map(targets, (target) => this.createRequest(target));
    }
};

(function ($) {    	
    $.fn.xvalidate = function (options) {
        return this.each(function () {
            let form = new XValidate.Form($(this));
			let validator = new XValidate.Validator(form);
            form.onValidateRequired(() => validator.validate());
        });
    };
})(jQuery);

$(function() {
    /*default implementation*/
    let forms = $('[data-xval-form]').xvalidate();
    console.log(forms);
});
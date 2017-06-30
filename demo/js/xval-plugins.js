(function() {
    // the plugins
    var plugins = {
        "true": {
            name: 'true',
            url: 'http://www.mocky.io/v2/56c529e30f0000aa0ea20418'
        },
        "false": {
            name: 'false',
            url: 'http://www.mocky.io/v2/56c52a460f0000bc0ea2041a'
        },
        negativeTrue: {
            name: 'negative-true',
            url: 'http://www.mocky.io/v2/56c529e30f0000aa0ea20418',
            validateResponse: function(response) {
                return response === false;
            }
        },
        test: {
            name: 'test-plugin',
            url: 'http://jsonplaceholder.typicode.com/users/',
            message: '',
            validateResponse: function(response) {
                console.log(response);
                return false;
            }
        },
        duplicateTest: {
            name: 'test-plugin',
            url: 'http://jsonplaceholder.typicode.com/users/',
            validateResponse: function(response) {
                alert('I am a duplicate plugin');
                return false;
            }
        },
        optional: {
            name: 'optional-plugin',
            url: 'http://jsonplaceholder.typicode.com/users/',
            message: 'I am an optional plugin'
        },
        plugin1: {
            name: 'plugin1',
            url: 'http://jsonplaceholder.typicode.com/users/',
            message: 'Plugin1 error - ${0}'
        },
        plugin2: {
            name: 'plugin2',
            url: 'http://jsonplaceholder.typicode.com/users/',
            message: 'Plugin2 error. I should be valid.',
            validateResponse: function(response) {
                return true;
            }
        },
        nestedPlugin: {
            name: 'nested-plugin',
            url: 'http://jsonplaceholder.typicode.com/users/'
        }
    };
    XValidate.Plugins.addRange(plugins);

    // test the validated callback
    $('#nested2').on('xval.validated', (event, args) => alert(args.valid));
})();
var plugins = {
    test: {
        name: 'test-plugin',
        url: 'http://jsonplaceholder.typicode.com/users/',
        message: '',
        validateResult: function(result) {
            console.log(result);
            return false;
        }
    },
    duplicateTest: {
        name: 'test-plugin',
        url: 'http://jsonplaceholder.typicode.com/users/',
        validateResult: function(result) {
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
        message: 'Plugin1 error'
    },
    plugin2: {
        name: 'plugin2',
        url: 'http://jsonplaceholder.typicode.com/users/',
        message: 'Plugin2 error. I should be valid.',
        validateResult: function(result) {
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
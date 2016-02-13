var plugins = {
    test: {
        name: 'test-plugin',
        url: 'http://jsonplaceholder.typicode.com/users/',
        callback: function(result) {
            console.log(result);
            return false;
        }
    },
    duplicateTest: {
        name: 'test-plugin',
        url: 'http://jsonplaceholder.typicode.com/users/',
        callback: function(result) {
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
        message: 'Plugin2 error'
    }
};
XValidate.Plugins.add(plugins.test);
XValidate.Plugins.add(plugins.duplicateTest);
XValidate.Plugins.add(plugins.optional);
XValidate.Plugins.add(plugins.plugin1);
XValidate.Plugins.add(plugins.plugin2);
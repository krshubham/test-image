const shell = require('shelljs');
const zmq = require('zeromq');
const fs = require('fs');
const path = require('path');


async function run_c_code(message, out){
    try {
        const file_name = `${message.id}-${PORT}-${Date.now()}`;
        const file = path.join(__dirname,'codes',file_name);
        const file_dir = path.join(__dirname,'codes');
        fs.writeFileSync(`${file}.c`,message.code);
        console.log('Compiling C code..');
        const compile_response = shell.exec(`gcc -w ${file}.c -o ${file}`);
        if(compile_response.code === 0){
            console.log("No compilation error");
            out.compileout = compile_response.stdout;
            shell.cd(file_dir);
            const invoke_response = shell.exec(`gtimeout ${timeout} ./${file_name}`);
            if(invoke_response.code === 0){
                out.stdout = invoke_response.stdout;
                console.log('The program executed successfully');
            }
            else if(invoke_response.code === 124){
                out.codetimeout = true;
                console.log('timeout occured');
            }
            else{
                out.stderr = invoke_response.stderr;
            }
            fs.unlinkSync(`${file}.c`);
            fs.unlinkSync(`${file}`);
        }
        else{
            out.compileerror = compile_response.stderr;
        }
    }
    catch(err){
        console.log(err);
        out['status'] = 'Exception occured while creating the file for source code';
    }
}

async function run_cpp_code(message, out){
    try {
        const file_name = `${message.id}-${PORT}-${Date.now()}`;
        const file = path.join(__dirname,'codes',file_name);
        const file_dir = path.join(__dirname,'codes');
        fs.writeFileSync(`${file}.cpp`,message.code);
        const compile_response = shell.exec(`g++ -std=c++14 -w ${file}.cpp -o ${file}`);
        if(compile_response.code === 0){
            out.compileout = compile_response.stdout;
            shell.cd(file_dir);
            const invoke_response = shell.exec(`gtimeout ${timeout} ./${file_name}`);
            if(invoke_response.code === 0){
                out.stdout = invoke_response.stdout;
                console.log('The program executed successfully');
            }
            else if(invoke_response.code === 124){
                out.codetimeout = true;
                console.log('timeout occured');
            }
            else{
                out.stderr = invoke_response.stderr;
            }
        }
        else{
            out.compileerror = compile_response.stderr;
        }
        fs.unlinkSync(`${file}.cpp`);
        fs.unlinkSync(`${file}`);
    }
    catch(err){
        console.log(err);
        out['status'] = 'Exception occured while creating the file for source code';
    }
}

async function run_python_code(message, out){
    try {
        const file = path.join(__dirname,'codes',`${message.id}-${PORT}-${Date.now()}.py`);
        const file_dir = path.join(__dirname,'codes');
        fs.writeFileSync(file,message.code);
        const command_response = shell.exec(`gtimeout ${timeout} python3 ${file}`);
        if(command_response.code === 0){
            // The command executed successfully
            console.log('executed succssfully');
            out.stdout = command_response.stdout;
        }
        else if(command_response.code === 124){
            console.log(command_response);
            out.codetimeout = true;
        }
        else{
            out.status = 'Some exception occured while trying to run the code';
            out.stderror = command_response.stderr;
        }
        fs.unlinkSync(file);
    }
    catch(err){
        console.log(err);
        out.status = 'Exception occured while creating the file for source code';
    }
}




/**
 * 
 * @param {string} lang The language of the source code
 * @param {Array<tring>} file_names The name of the files to be used
 * @param {Array<string>} file_contents The contents inside the files
 * @param {string} stdin Standard input for the code
 * @param {number} timeout The specified timelimit
 * @param {string} id The name of the file
 * @param {string} source The source code of the program
 */
async function run_code(message){
    let out = {
        compileout: '',
        compileerror: '',
        codetimeout: '',
        stdout: '',
        stderror: '',
        testcase_compileout: '',
        testcase_compileerror: '',
        testcase_stdout: '',
        testcase_stderror: '',
        status: '',
        id: message.id
    };
    if(!fs.existsSync(path.join(__dirname,'codes'))){
        fs.mkdirSync(path.join(__dirname,'codes'));
    }
    try {
        const timestamp = Date.now().toString();
        let testCasePresent = message.testcasepresent || false;
        timeout = message.timeout || '10s';
        if(message.language == 'C'){
            await run_c_code(message,out);
        }
        else if(message.language == 'CPP'){
            await run_cpp_code(message, out);
        }
        else if(message.language == 'Python'){
            await run_python_code(message, out);
        }
    }
    catch(err){
        console.log(err);
        out.status = 'Exception occured';
    }
    return out;
}

// The port at which the zmq server is listening
const PORT = 5557;

const sock = new zmq.Socket('rep');

sock.bindSync(`tcp://*:${PORT}`);

console.log(`Server listening on port ${PORT}`);

sock.on('message', async (data) => {
    try {
        const response = await run_code(JSON.parse(data));
        console.log(response);
        // convert JSON object to buffer before sending back
        let buffer = Buffer.from('');
        if(response){
            buffer = Buffer.from(JSON.stringify(response));
        }
        sock.send(buffer);
    }
    catch(err){
        console.log(err);
    }
});

# c3po
My First Discord Bot, written in Typescript.

Commands include:
- c?help => (get list of commands)
- c?servertime => (returns the datetime of the server)
- c?echo <message> => (sends back <message>)
- c?multiply <x> <message> => (sends back <message> <x> number of times)
- c?say2 <number> => (sends back <number> in english text)
- c?tictactoe => (start a game of tic tac toe)
- c?ph <number> => (return <number> r/programmerhumor memes)
- c?pup <width> <height> <link> => (returns an image of the link sent at (<width>, <height>) resolution)
- c?js <javascript code> => executes javascript code like "(() => 4 + 5);" and returns result
- c?py <python code> => executes python code like "def main(): return 4 + 5" and returns result

I am currently hosting this bot on a raspberry pi at home.
In order to avoid potential security issues associated to running unknown code on my hardware, I am running the js or py code from the c?js and c?py commands by sending the code as a string over to the correlated API that I wrote on https://repl.it/
JS code is executed here - https://repl.it/@Nate314/test
Python code is executed here - https://repl.it/@Nate314/Python-Test

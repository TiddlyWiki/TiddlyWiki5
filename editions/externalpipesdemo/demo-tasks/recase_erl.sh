#!/usr/bin/env escript

%% run with sh ./recase_erl.sh

-mode(compile).

main(_) ->
    {ok, Listen} = gen_tcp:listen(8081, [binary,{packet,4},
					 {active,true}]),
    spawn(fun() -> par_connect(Listen) end),
    receive after infinity -> void end.
		    
par_connect(Listen) ->
    {ok, Socket} = gen_tcp:accept(Listen),
    io:format("connected ~n"),
    spawn(fun() -> par_connect(Listen) end),
    loop(Socket).

loop(Socket) -> 
    receive
	{tcp,Socket,Bin} ->
	    io:format("received ~p bytes ~s ~n",[size(Bin), Bin]),
	    Return = recase_binary(Bin),
	    io:format("sending: ~p bytes~n",[size(Return)]),
	    gen_tcp:send(Socket, Return),
	    loop(Socket);
	Other ->
	    io:format("received ~p~n",[Other])
    end.

recase_binary(<<1,B/binary>>) ->
    L = binary_to_list(B),
    L1 = [recase(I) || I <- L],
    B1 = list_to_binary(L1),
    <<1,B1/binary>>.

recase(I) when I >= $a, I =< $z -> I - $a + $A;
recase(I) when I >= $A, I =< $Z -> I - $A + $a;
recase(I)                       -> I.

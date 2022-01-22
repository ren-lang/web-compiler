port module Main exposing (main)

import Ren.Compiler exposing (..)
import Set exposing (Set)


main : Program () (Set String) String
main =
    Platform.worker
        { init = always ( Set.empty, Cmd.none )
        , update =
            \input cache ->
                ( cache
                , if Set.member input cache then
                    Cmd.none

                  else
                    run untyped input
                        |> Result.toMaybe
                        |> Maybe.map toJavascript
                        |> Maybe.withDefault Cmd.none
                )
        , subscriptions = always <| fromJavascript Basics.identity
        }


port toJavascript : String -> Cmd msg


port fromJavascript : (String -> msg) -> Sub msg

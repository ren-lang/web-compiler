port module Main exposing (main)

-- IMPORTS ---------------------------------------------------------------------

import Dict exposing (Dict)
import Ren.Compiler exposing (..)



-- PORTS -----------------------------------------------------------------------


port toJavascript : String -> Cmd msg


port fromJavascript : (String -> msg) -> Sub msg



-- MAIN ------------------------------------------------------------------------


{-| It might seem a bit weird to keep `Maybe`s in a dictionary, but by doing this
we save the effort of re-parsing invalid inputs. If they're `Nothing` we know
something went wrong!

In the future we should probably store the compiler error instead, using a `Result`
so that we can report it to users, but this gets the job done for now.

-}
type alias Cache =
    Dict String (Maybe String)


main : Program () Cache String
main =
    Platform.worker
        { init =
            \_ -> ( Dict.empty, Cmd.none )
        , update =
            \input cache ->
                if Dict.member input cache then
                    ( cache
                    , Dict.get input cache
                        |> Maybe.andThen Basics.identity
                        |> Maybe.map toJavascript
                        |> Maybe.withDefault Cmd.none
                    )

                else
                    case run untyped input |> Result.toMaybe of
                        Just esm ->
                            ( Dict.insert input (Just esm) cache
                            , toJavascript esm
                            )

                        Nothing ->
                            ( Dict.insert input Nothing cache
                            , Cmd.none
                            )
        , subscriptions =
            \_ -> fromJavascript Basics.identity
        }

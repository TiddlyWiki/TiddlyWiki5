<?php

$smtp = "smtp.gmail.com";
$sender = "info@tiddlywiki.com";
$recipient = "info@tiddlywiki.com";
$subject = "Test Report";

ini_set("SMTP", $smtp);
ini_set("smtp_port", "465");
ini_set("sendmail_from", $sender);

echo $message = "Total : " . $_POST["total"] . " Failures : " . $_POST["failures"];

echo mail($recipient, $subject, $message);

?>

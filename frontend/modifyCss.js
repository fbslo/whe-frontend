document.addEventListener('DOMContentLoaded', async function() {
  let color = await document.getElementById("color_bg").innerText
  $(".bg-danger").each(function() {
    $(this).attr('style', `border-color: ${color} !important`);
    $(this).attr('style', `background-color: ${color} !important`);
  });
}, false);
